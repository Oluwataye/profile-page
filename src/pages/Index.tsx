import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { Loader2, LogOut, Settings, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  tech_stack: string[] | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data: projectsData, error } = await supabase
        .from("projects")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const projectsWithCounts = await Promise.all(
        (projectsData || []).map(async (project) => {
          const [likesResult, commentsResult, likeResult] = await Promise.all([
            supabase
              .from("likes")
              .select("*", { count: "exact", head: true })
              .eq("project_id", project.id),
            supabase
              .from("comments")
              .select("*", { count: "exact", head: true })
              .eq("project_id", project.id),
            user
              ? supabase
                  .from("likes")
                  .select("id")
                  .eq("project_id", project.id)
                  .eq("user_id", user.id)
                  .single()
              : { data: null },
          ]);

          return {
            ...project,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
            is_liked: !!likeResult.data,
          };
        })
      );

      setProjects(projectsWithCounts);
    } catch (error: any) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">
            TAYE DAVID IBUKUN
          </h1>
          <div className="flex gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-muted/20 to-background" />
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <h2 className="text-6xl md:text-8xl font-bold mb-8 tracking-tight text-foreground animate-fade-in">
            TAYEDATAINSIGHTS
          </h2>
          <p className="text-xl md:text-2xl italic text-muted-foreground mb-12 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Data Analyst skilled in Excel, PowerBI, Tableau, SQL & Python @Taye David Ibukun
          </p>
          <button 
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
            className="w-16 h-16 rounded-full border-2 border-foreground/30 hover:border-foreground/60 flex items-center justify-center mx-auto transition-all hover:scale-110 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
            aria-label="Scroll to projects"
          >
            <ChevronDown className="w-6 h-6 text-foreground/60" />
          </button>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No projects yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div
                key={project.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ProjectCard {...project} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Professional Portfolio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
