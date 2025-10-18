import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, ExternalLink } from "lucide-react";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  tech_stack: string[] | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export const ProjectCard = ({
  id,
  title,
  description,
  thumbnail_url,
  tech_stack,
  likes_count,
  comments_count,
  is_liked,
}: ProjectCardProps) => {
  return (
    <Link to={`/project/${id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-[var(--shadow-elegant)] hover:-translate-y-1">
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ExternalLink className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-muted-foreground line-clamp-2 mb-4">{description}</p>
          {tech_stack && tech_stack.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tech_stack.slice(0, 3).map((tech, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
              {tech_stack.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{tech_stack.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="px-6 pb-6 pt-0 flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className={`w-4 h-4 ${is_liked ? "fill-accent text-accent" : ""}`} />
            <span>{likes_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-4 h-4" />
            <span>{comments_count}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
