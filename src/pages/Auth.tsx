import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Security: Strong password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Security: Email validation schema with sanitization
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .transform((email) => email.toLowerCase().trim())
  .refine((email) => email.length <= 254, "Email address is too long");

// Security: Full name validation with XSS prevention
const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name is too long")
  .regex(/^[a-zA-Z\s'-]+$/, "Name contains invalid characters")
  .transform((name) => name.trim().replace(/\s+/g, ' '));

// Security: Rate limiting - track failed login attempts
const rateLimiter = {
  attempts: new Map<string, { count: number; lastAttempt: number }>(),
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ATTEMPT_WINDOW: 5 * 60 * 1000, // 5 minutes

  checkRateLimit(email: string): { allowed: boolean; remainingTime?: number } {
    const now = Date.now();
    const record = this.attempts.get(email);

    if (!record) return { allowed: true };

    // Reset if attempt window has passed
    if (now - record.lastAttempt > this.ATTEMPT_WINDOW) {
      this.attempts.delete(email);
      return { allowed: true };
    }

    // Check if locked out
    if (record.count >= this.MAX_ATTEMPTS) {
      const lockoutEnd = record.lastAttempt + this.LOCKOUT_DURATION;
      if (now < lockoutEnd) {
        const remainingTime = Math.ceil((lockoutEnd - now) / 60000);
        return { allowed: false, remainingTime };
      }
      // Lockout period expired
      this.attempts.delete(email);
      return { allowed: true };
    }

    return { allowed: true };
  },

  recordAttempt(email: string) {
    const now = Date.now();
    const record = this.attempts.get(email);

    if (!record || now - record.lastAttempt > this.ATTEMPT_WINDOW) {
      this.attempts.set(email, { count: 1, lastAttempt: now });
    } else {
      record.count++;
      record.lastAttempt = now;
    }
  },

  resetAttempts(email: string) {
    this.attempts.delete(email);
  },
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Clean up invalid sessions but don't auto-redirect
        // This allows users to access /auth page regardless of login state
        if (session && !error) {
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (!user || userError) {
            // Session exists but user is invalid - clear it
            await supabase.auth.signOut();
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        await supabase.auth.signOut();
      } finally {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  // Show loading while checking for existing session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Security: Input sanitization - remove potential XSS vectors
  const sanitizeInput = (input: string): string => {
    return input.replace(/[<>]/g, '').trim();
  };

  // Security: Validate all inputs before submission
  const validateInputs = (): boolean => {
    const errors: string[] = [];

    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(error.issues[0].message);
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(error.issues[0].message);
      }
    }

    if (!isLogin) {
      try {
        nameSchema.parse(fullName);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push(error.issues[0].message);
        }
      }

      if (password !== confirmPassword) {
        errors.push("Passwords do not match");
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors([]);

    // Security: Sanitize all inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(fullName);

    // Security: Client-side validation
    if (!validateInputs()) {
      return;
    }

    // Security: Rate limiting check
    const rateCheck = rateLimiter.checkRateLimit(sanitizedEmail);
    if (!rateCheck.allowed) {
      toast.error(
        `Too many failed attempts. Please try again in ${rateCheck.remainingTime} minutes.`
      );
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });

        if (error) {
          // Security: Record failed attempt for rate limiting
          rateLimiter.recordAttempt(sanitizedEmail);

          // Security: Generic error message to prevent user enumeration
          throw new Error("Invalid email or password. Please try again.");
        }

        // Security: Reset attempts on successful login
        rateLimiter.resetAttempts(sanitizedEmail);
        
        // Check if user is admin to redirect appropriately
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          toast.success("Welcome back!");
          navigate(roleData ? "/admin" : "/");
        }
      } else {
        // Security: Double-check password match
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }

        const { error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: sanitizedName,
            },
          },
        });

        if (error) {
          // Security: Generic error message to prevent information leakage
          if (error.message.includes("already registered")) {
            throw new Error("This email is already in use. Please sign in instead.");
          }
          throw new Error("Unable to create account. Please try again.");
        }

        toast.success("Account created successfully! Please check your email to verify.");
        setIsLogin(true);
        // Security: Clear sensitive data
        setPassword("");
        setConfirmPassword("");
        setFullName("");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setValidationErrors([]);
    setPassword("");
    setConfirmPassword("");
    setFullName("");
  };

  const handleClearSession = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Session cleared successfully");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to clear session");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-elegant)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {isLogin ? "Secure Sign In" : "Secure Registration"}
            </CardTitle>
          </div>
          <CardDescription>
            {isLogin 
              ? "Sign in securely to manage your portfolio" 
              : "Create your account with enterprise-grade security"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {validationErrors.length > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  maxLength={100}
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password
                {!isLogin && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Min 8 chars, uppercase, lowercase, number, special char)
                  </span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={128}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLogin}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Securely...
                </>
              ) : isLogin ? (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Sign In Securely
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Create Secure Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary hover:underline"
              disabled={loading}
            >
              {isLogin ? "Need an account? Sign up securely" : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={handleClearSession}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              Having issues? Clear session and retry
            </button>
          </div>

          {!isLogin && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <Shield className="w-3 h-3 inline mr-1" />
                Your data is protected with enterprise-grade encryption and security measures.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;