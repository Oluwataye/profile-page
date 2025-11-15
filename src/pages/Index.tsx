import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { ServiceCard } from "@/components/ServiceCard";
import { TechStack } from "@/components/TechStack";
import { SocialProof } from "@/components/SocialProof";
import { CategoryFilter } from "@/components/CategoryFilter";
import { Loader2, LogOut, Settings, ChevronDown, Rocket, Code2, Palette, Zap, Target, Users } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/taye-nocode-logo.svg";
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [siteContent, setSiteContent] = useState({
    hero_heading: "TAYE-NOCODE",
    hero_subtitle: "Nocode Expert in Lovable, Bolt, V0, Replit @Taye David Ibukun",
    about_title: "About Me",
    about_left_heading: "Nocode Development Expert",
    about_left_paragraph1: "",
    about_left_paragraph2: "",
    about_right_heading: "What I Offer",
    about_services: [] as string[],
    contact_title: "Get In Touch",
    contact_heading: "Let's Work Together",
    contact_description: "",
    contact_email: "contact@taye-nocode.com",
    contact_availability: "Projects • Partnerships • Consulting",
    footer_text: "T-Tech Solutions"
  });
  const navigate = useNavigate();
  const PROJECTS_PER_PAGE = 6;
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminRole(session.user.id);
      }
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      const {
        data
      } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").single();
      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };
  useEffect(() => {
    fetchProjects(0);
    fetchProfilePhoto();
  }, []);
  const fetchProfilePhoto = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("site_settings").select("*").maybeSingle();
      if (error) throw error;
      if (data) {
        setProfilePhotoUrl(data.profile_photo_url || null);
        setLogoUrl(data.logo_url || null);
        setMaintenanceMode(data.maintenance_mode || false);
        setSiteContent({
          hero_heading: data.hero_heading || "TAYE-NOCODE",
          hero_subtitle: data.hero_subtitle || "Nocode Expert in Lovable, Bolt, V0, Replit @Taye David Ibukun",
          about_title: data.about_title || "About Me",
          about_left_heading: data.about_left_heading || "Nocode Development Expert",
          about_left_paragraph1: data.about_left_paragraph1 || "",
          about_left_paragraph2: data.about_left_paragraph2 || "",
          about_right_heading: data.about_right_heading || "What I Offer",
          about_services: (Array.isArray(data.about_services) ? data.about_services : []) as string[],
          contact_title: data.contact_title || "Get In Touch",
          contact_heading: data.contact_heading || "Let's Work Together",
          contact_description: data.contact_description || "",
          contact_email: data.contact_email || "contact@taye-nocode.com",
          contact_availability: data.contact_availability || "Projects • Partnerships • Consulting",
          footer_text: data.footer_text || "T-Tech Solutions"
        });
      }
    } catch (error: any) {
      console.error("Failed to load site settings:", error);
    }
  };
  const fetchProjects = async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      }
      const from = pageNum * PROJECTS_PER_PAGE;
      const to = from + PROJECTS_PER_PAGE - 1;
      
      let query = supabase.from("projects").select("*, project_categories(category_id)", {
        count: "exact"
      }).eq("published", true);

      // Filter by categories if any are selected
      if (selectedCategories.length > 0) {
        query = query.in("project_categories.category_id", selectedCategories);
      }

      const {
        data: projectsData,
        error,
        count
      } = await query.order("created_at", {
        ascending: false
      }).range(from, to);

      if (error) throw error;
      const projectsWithCounts = await Promise.all((projectsData || []).map(async project => {
        const [likesResult, commentsResult, likeResult] = await Promise.all([supabase.from("likes").select("*", {
          count: "exact",
          head: true
        }).eq("project_id", project.id), supabase.from("comments").select("*", {
          count: "exact",
          head: true
        }).eq("project_id", project.id), user ? supabase.from("likes").select("id").eq("project_id", project.id).eq("user_id", user.id).single() : {
          data: null
        }]);
        return {
          ...project,
          likes_count: likesResult.count || 0,
          comments_count: commentsResult.count || 0,
          is_liked: !!likeResult.data
        };
      }));
      if (append) {
        setProjects(prev => [...prev, ...projectsWithCounts]);
      } else {
        setProjects(projectsWithCounts);
      }
      setHasMore((count || 0) > (pageNum + 1) * PROJECTS_PER_PAGE);
      setPage(pageNum);
    } catch (error: any) {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  const handleLoadMore = () => {
    fetchProjects(page + 1, true);
  };
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>;
  }

  // Show maintenance page if maintenance mode is enabled and user is not admin
  if (maintenanceMode && !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center px-4 max-w-2xl animate-fade-in">
          <div className="mb-8">
            <Settings className="w-24 h-24 mx-auto text-primary/50 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Under Maintenance
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            We're currently performing scheduled maintenance to improve your experience.
            <br />
            Please check back soon!
          </p>
          <div className="text-sm text-muted-foreground/70">
            Expected to be back online shortly
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header with Progress Indicator */}
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img src={logoUrl || logo} alt="Taye NoCode Logo" className="h-12 md:h-14 animate-fade-in" />
          <nav className="hidden md:flex gap-6 items-center">
            <button onClick={() => document.getElementById('about')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105">About</button>
            <button onClick={() => document.getElementById('projects')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105">Projects</button>
            <button onClick={() => document.getElementById('contact')?.scrollIntoView({
            behavior: 'smooth'
          })} className="text-foreground hover:text-primary transition-all duration-300 font-medium hover:scale-105">Contact</button>
            <Button size="sm" onClick={() => document.getElementById('contact')?.scrollIntoView({
            behavior: 'smooth'
          })} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all hover:scale-105 shadow-lg">
              Hire Me
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section - Enhanced */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={{
        backgroundImage: 'var(--gradient-mesh)'
      }} />
        
        <div className="container mx-auto max-w-5xl text-center space-y-6 mb-20 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4 animate-fade-in">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-[#e55a42]/95">Available for new projects • Fast turnaround</span>
          </div>

          {profilePhotoUrl && <div className="flex justify-center mb-8 animate-scale-in" style={{
          animationDelay: "0.1s"
        }}>
              <div className="relative w-32 h-32 md:w-40 md:h-40 animate-float">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-secondary-accent animate-pulse-glow" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                  <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>}
          
          <h2 style={{
          animationDelay: "0.2s"
        }} className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-fade-in text-blue-600">
            {siteContent.hero_heading}
          </h2>
          <p style={{
          animationDelay: "0.3s"
        }} className="text-xl md:text-2xl lg:text-3xl font-medium max-w-3xl mx-auto animate-fade-in text-[#ae09a9]/[0.58]">
            {siteContent.hero_subtitle}
          </p>
          <p className="text-lg md:text-xl text-accent/90 font-semibold animate-fade-in" style={{
          animationDelay: "0.4s"
        }}>
            Build scalable MVPs 10x faster without traditional code
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8 animate-fade-in" style={{
          animationDelay: "0.5s"
        }}>
            <Button size="lg" onClick={() => document.getElementById('projects')?.scrollIntoView({
            behavior: 'smooth'
          })} className="bg-gradient-to-r from-primary via-accent to-secondary-accent hover:opacity-90 transition-all hover:scale-105 shadow-[var(--shadow-glow)] text-lg px-8">
              View My Work
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('contact')?.scrollIntoView({
            behavior: 'smooth'
          })} className="border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all hover:scale-105 text-lg px-8 text-[#060606]/85">
              Let's Talk
            </Button>
          </div>
        </div>
        
        <button onClick={() => window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      })} className="absolute bottom-12 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white/60 hover:bg-white/10 transition-all duration-300 animate-pulse-glow group" aria-label="Scroll down">
          <ChevronDown className="w-6 h-6 text-white group-hover:animate-bounce" />
        </button>
      </section>

      {/* About Section - Card-Based with Icons */}
      <section id="about" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary-accent bg-clip-text text-transparent animate-fade-in">
              {siteContent.about_title}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{
            animationDelay: "0.1s"
          }}>
              Transforming ideas into reality with modern no-code solutions
            </p>
          </div>

          {/* About Content */}
          {(siteContent.about_left_paragraph1 || siteContent.about_left_paragraph2) && <div className="max-w-3xl mx-auto mb-16 animate-fade-in" style={{
          animationDelay: "0.2s"
        }}>
              <div className="bg-card/50 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 shadow-[var(--shadow-elegant)]">
                <h3 className="text-2xl font-semibold mb-4 text-foreground">{siteContent.about_left_heading}</h3>
                {siteContent.about_left_paragraph1 && <p className="text-muted-foreground leading-relaxed mb-4">
                    {siteContent.about_left_paragraph1}
                  </p>}
                {siteContent.about_left_paragraph2 && <p className="text-muted-foreground leading-relaxed">
                    {siteContent.about_left_paragraph2}
                  </p>}
              </div>
            </div>}

          {/* Services Grid with Icons */}
          {siteContent.about_services.length > 0 && <>
              <h3 className="text-3xl font-bold text-center mb-12 animate-fade-in" style={{
            animationDelay: "0.3s"
          }}>
                {siteContent.about_right_heading}
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {siteContent.about_services.map((service, index) => {
              const icons = [Rocket, Code2, Palette, Zap, Target, Users];
              const icon = icons[index % icons.length];
              return <ServiceCard key={index} icon={icon} title={service.split(':')[0] || service} description={service.split(':')[1]?.trim() || service} delay={index * 0.1} />;
            })}
              </div>
            </>}
        </div>
      </section>

      {/* Tech Stack Section */}
      <TechStack />

      {/* Social Proof Section */}
      <SocialProof />

      {/* Projects Grid - Enhanced */}
      <section id="projects" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary-accent bg-clip-text text-transparent animate-fade-in">
              Featured Projects
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{
            animationDelay: "0.1s"
          }}>
              Explore my latest work and success stories
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-12">
            <CategoryFilter 
              selectedCategories={selectedCategories}
              onCategoryChange={(categories) => {
                setSelectedCategories(categories);
                fetchProjects(0);
              }}
            />
          </div>

          {loading ? <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div> : projects.length === 0 ? <div className="text-center py-20 animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Rocket className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground text-lg">No projects yet. Check back soon for amazing work!</p>
            </div> : <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => <div key={project.id} className="animate-fade-in-up" style={{
              animationDelay: `${index * 0.1}s`
            }}>
                    <ProjectCard {...project} />
                  </div>)}
              </div>
              
              {hasMore && <div className="flex justify-center mt-16 animate-fade-in">
                  <Button onClick={handleLoadMore} disabled={loadingMore} size="lg" className="bg-gradient-to-r from-primary via-accent to-secondary-accent hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-[var(--shadow-glow)] px-12 py-6 text-lg">
                    {loadingMore ? <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading More...
                      </> : "Load More Projects"}
                  </Button>
                </div>}
            </>}
        </div>
      </section>

      {/* Contact Section - Enhanced */}
      <section id="contact" className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary-accent/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'var(--gradient-mesh)'
      }} />
        
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-accent to-secondary-accent bg-clip-text text-transparent animate-fade-in">
              {siteContent.contact_title}
            </h2>
            <p className="text-xl text-muted-foreground animate-fade-in" style={{
            animationDelay: "0.1s"
          }}>
              I typically respond within 24 hours
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8 animate-fade-in" style={{
            animationDelay: "0.2s"
          }}>
              <div>
                <h3 className="text-3xl font-semibold text-foreground mb-4">{siteContent.contact_heading}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  {siteContent.contact_description || "Have a project in mind? Let's discuss how we can bring your vision to life with cutting-edge no-code solutions."}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border-2 border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-xl">@</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email Me</p>
                    <a href={`mailto:${siteContent.contact_email}`} className="text-foreground font-semibold text-lg hover:text-primary transition-colors">
                      {siteContent.contact_email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border-2 border-accent/20 hover:border-accent/40 transition-all hover:shadow-lg group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-secondary-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="text-white font-bold text-xl">#</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Available For</p>
                    <p className="text-foreground font-semibold text-lg">{siteContent.contact_availability}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-8 shadow-[var(--shadow-elegant)] animate-fade-in" style={{
            animationDelay: "0.3s"
          }}>
              <form className="space-y-6" onSubmit={e => {
              e.preventDefault();
              toast.success("Thanks for reaching out! I'll get back to you within 24 hours.");
              (e.target as HTMLFormElement).reset();
            }}>
                <div className="group">
                  <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2 group-focus-within:text-primary transition-colors">
                    Your Name
                  </label>
                  <input type="text" id="name" required placeholder="John Doe" className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all placeholder:text-muted-foreground/50" />
                </div>

                <div className="group">
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2 group-focus-within:text-primary transition-colors">
                    Your Email
                  </label>
                  <input type="email" id="email" required placeholder="john@example.com" className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all placeholder:text-muted-foreground/50" />
                </div>

                <div className="group">
                  <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2 group-focus-within:text-primary transition-colors">
                    What's your challenge?
                  </label>
                  <textarea id="message" rows={5} required placeholder="Tell me about your project..." className="w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground resize-none transition-all placeholder:text-muted-foreground/50" />
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-primary via-accent to-secondary-accent hover:opacity-90 transition-all hover:scale-105 shadow-lg py-6 text-lg font-semibold">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Enhanced */}
      <footer className="border-t bg-card/30 backdrop-blur-sm py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="text-muted-foreground">
                &copy; {new Date().getFullYear()} {siteContent.footer_text}. All rights reserved.
              </p>
            </div>
            
            <div className="flex gap-6">
              <button onClick={() => document.getElementById('about')?.scrollIntoView({
              behavior: 'smooth'
            })} className="text-muted-foreground hover:text-primary transition-colors">
                About
              </button>
              <button onClick={() => document.getElementById('projects')?.scrollIntoView({
              behavior: 'smooth'
            })} className="text-muted-foreground hover:text-primary transition-colors">
                Projects
              </button>
              <button onClick={() => document.getElementById('contact')?.scrollIntoView({
              behavior: 'smooth'
            })} className="text-muted-foreground hover:text-primary transition-colors">
                Contact
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;