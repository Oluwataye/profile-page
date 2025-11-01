import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, ExternalLink, ArrowRight } from "lucide-react";

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
    <Card className="group relative overflow-hidden transition-all duration-500 hover:shadow-[var(--shadow-glow)] hover:-translate-y-2 border-2 hover:border-primary/30">
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-secondary-accent/10">
        {/* Mockup-style frame */}
        <div className="absolute top-2 left-2 right-2 h-6 bg-card/80 backdrop-blur-sm rounded-t-lg flex items-center gap-2 px-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
        </div>

        {thumbnail_url ? (
          <img
            src={thumbnail_url}
            alt={title}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ExternalLink className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Slide-up overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex items-end p-6">
          <div className="w-full">
            <div className="flex flex-wrap gap-2 mb-4">
              {tech_stack && tech_stack.slice(0, 4).map((tech, index) => (
                <Badge 
                  key={index} 
                  className="bg-primary/20 text-primary border-primary/30 backdrop-blur-sm"
                >
                  {tech}
                </Badge>
              ))}
            </div>
            <Link to={`/project/${id}`}>
              <Button 
                className="w-full bg-gradient-to-r from-primary via-accent to-secondary-accent hover:opacity-90 group/btn"
              >
                View Case Study
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-1">
          {title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
          {description}
        </p>
        
        {/* Tech stack visible when not hovering */}
        {tech_stack && tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-2 group-hover:opacity-0 transition-opacity duration-300">
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

      <CardFooter className="px-6 pb-6 pt-0 flex justify-between items-center">
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 hover:text-accent transition-colors">
            <Heart className={`w-4 h-4 ${is_liked ? "fill-accent text-accent" : ""}`} />
            <span className="font-medium">{likes_count}</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span className="font-medium">{comments_count}</span>
          </div>
        </div>
        
        <Link to={`/project/${id}`} className="text-sm text-primary hover:text-accent transition-colors font-medium group-hover:underline">
          View Details →
        </Link>
      </CardFooter>
    </Card>
  );
};
