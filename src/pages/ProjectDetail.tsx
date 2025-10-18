import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ShareButtons } from "@/components/ShareButtons";
import { Heart, MessageCircle, ExternalLink, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  images: string[] | null;
  tech_stack: string[] | null;
  project_url: string | null;
  demo_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profiles: {
    full_name: string | null;
  } | null;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchComments();
      fetchLikes();
    }
  }, [id, user]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error: any) {
      toast.error("Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          updated_at,
          user_id,
          profiles!comments_profile_fkey(full_name)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    }
  };

  const fetchLikes = async () => {
    try {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("project_id", id);

      setLikesCount(count || 0);

      if (user) {
        const { data } = await supabase
          .from("likes")
          .select("id")
          .eq("project_id", id)
          .eq("user_id", user.id)
          .single();

        setIsLiked(!!data);
      }
    } catch (error: any) {
      console.error("Error fetching likes:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like projects");
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("project_id", id)
          .eq("user_id", user.id);
        setIsLiked(false);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase
          .from("likes")
          .insert({ project_id: id, user_id: user.id });
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error: any) {
      toast.error("Failed to update like");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("comments")
        .insert({ project_id: id, user_id: user.id, content: newComment.trim() });

      if (error) throw error;
      setNewComment("");
      fetchComments();
      toast.success("Comment added!");
    } catch (error: any) {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project not found</h2>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Portfolio
          </Button>
        </Link>

        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-4 items-center">
              <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className={isLiked ? "bg-accent hover:bg-accent/90" : ""}
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                {likesCount} {likesCount === 1 ? "Like" : "Likes"}
              </Button>
              <ShareButtons
                title={project.title}
                url={window.location.href}
              />
              {project.project_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Project
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Main Image */}
          {project.thumbnail_url && (
            <div className="rounded-xl overflow-hidden shadow-[var(--shadow-card)]">
              <img
                src={project.thumbnail_url}
                alt={project.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">About This Project</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          {project.tech_stack && project.tech_stack.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Technologies Used</h2>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comments Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageCircle className="w-5 h-5" />
                <h2 className="text-2xl font-semibold">
                  Comments ({comments.length})
                </h2>
              </div>

              {user && (
                <form onSubmit={handleComment} className="mb-6">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="mb-2"
                    rows={3}
                  />
                  <Button type="submit" disabled={submitting || !newComment.trim()}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post Comment"
                    )}
                  </Button>
                </form>
              )}

              {!user && (
                <p className="text-muted-foreground mb-6">
                  <Link to="/auth" className="text-primary hover:underline">
                    Sign in
                  </Link>{" "}
                  to leave a comment
                </p>
              )}

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">
                        {comment.profiles?.full_name || "Anonymous"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-muted-foreground">{comment.content}</p>
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
