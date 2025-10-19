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
  }, []);
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto max-w-5xl text-center space-y-8 mb-20">
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

      {/* Projects Grid */}
      <section className="container mx-auto px-4 py-16">
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

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} T-Tech Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>;
};
export default Index;