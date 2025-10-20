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
  const [loadingMore, setLoadingMore] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
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
      const { data, error } = await supabase
        .from("site_settings")
        .select("profile_photo_url")
        .single();

      if (error) throw error;
      setProfilePhotoUrl(data?.profile_photo_url || null);
    } catch (error: any) {
      console.error("Failed to load profile photo:", error);
    }
  };
  const fetchProjects = async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      }
      const from = pageNum * PROJECTS_PER_PAGE;
      const to = from + PROJECTS_PER_PAGE - 1;
      const {
        data: projectsData,
        error,
        count
      } = await supabase.from("projects").select("*", {
        count: "exact"
      }).eq("published", true).order("created_at", {
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
  return <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            TAYE DAVID IBUKUN
          </h1>
          <nav className="hidden md:flex gap-6">
            <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="text-foreground hover:text-primary transition-colors">About</button>
            <button onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })} className="text-foreground hover:text-primary transition-colors">Projects</button>
            <button onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })} className="text-foreground hover:text-primary transition-colors">Contact</button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto max-w-5xl text-center space-y-8 mb-20">
          {profilePhotoUrl && (
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                <img
                  src={profilePhotoUrl}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
          <h2 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight animate-fade-in">TAYE-NOCODE</h2>
          <p className="text-lg md:text-xl lg:text-2xl text-white/90 italic animate-fade-in" style={{
          animationDelay: "0.2s"
        }}>Nocode Expert in Lovable, Bolt, V0, Replit  @Taye David Ibukun</p>
        </div>
        
        <button onClick={() => window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth'
      })} className="absolute bottom-12 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-2 border-white/40 flex items-center justify-center hover:border-white/60 hover:bg-white/5 transition-all duration-300 animate-fade-in" style={{
        animationDelay: "0.4s"
      }} aria-label="Scroll to projects">
          <ChevronDown className="w-6 h-6 text-white" />
        </button>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-background/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">About Me</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">Nocode Development Expert</h3>
              <p className="text-muted-foreground leading-relaxed">
                Specializing in rapid application development using cutting-edge nocode platforms including Lovable, Bolt, V0, and Replit. 
                I transform ideas into functional, scalable applications without traditional coding barriers.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                With expertise in modern development workflows, I deliver high-quality solutions for startups, enterprises, 
                and individual clients looking to innovate quickly and efficiently.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-semibold text-foreground">What I Offer</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <span className="text-muted-foreground">Rapid MVP Development & Prototyping</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <span className="text-muted-foreground">Full-Stack Application Development</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <span className="text-muted-foreground">Database Design & Integration</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <span className="text-muted-foreground">UI/UX Implementation</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  <span className="text-muted-foreground">Consulting & Technical Partnership</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects" className="container mx-auto px-4 py-16">
        {loading ? <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div> : projects.length === 0 ? <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No projects yet. Check back soon!</p>
          </div> : <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project, index) => <div key={project.id} className="animate-fade-in" style={{
            animationDelay: `${index * 0.1}s`
          }}>
                  <ProjectCard {...project} />
                </div>)}
            </div>
            
            {hasMore && <div className="flex justify-center mt-12">
                <Button onClick={handleLoadMore} disabled={loadingMore} size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 hover:scale-105 shadow-lg">
                  {loadingMore ? <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Loading...
                    </> : "Load More Projects"}
                </Button>
              </div>}
          </>}
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Get In Touch</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-foreground mb-4">Let's Work Together</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Whether you're a startup looking to build your MVP, an enterprise seeking innovation, 
                  or an investor exploring opportunities, I'd love to hear from you.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">@</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-foreground font-medium">contact@taye-nocode.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-accent font-semibold">#</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available For</p>
                    <p className="text-foreground font-medium">Projects • Partnerships • Consulting</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card border rounded-lg p-6 shadow-lg">
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Thanks for reaching out! I'll get back to you soon."); }}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input type="text" id="name" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input type="email" id="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">Message</label>
                  <textarea id="message" rows={4} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"></textarea>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} T-Tech Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>;
};
export default Index;