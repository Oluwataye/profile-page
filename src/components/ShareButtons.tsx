import { Button } from "@/components/ui/button";
import { Share2, Linkedin, Twitter, Facebook, Instagram, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export const ShareButtons = ({ title, url }: ShareButtonsProps) => {
  const shareUrl = encodeURIComponent(url);
  const shareText = encodeURIComponent(title);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  const shareLinks = [
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    },
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${shareText}&body=Check out this project: ${shareUrl}`,
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {shareLinks.map((link) => (
          <DropdownMenuItem key={link.name} asChild>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center cursor-pointer"
            >
              <link.icon className="w-4 h-4 mr-2" />
              {link.name}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <Share2 className="w-4 h-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
