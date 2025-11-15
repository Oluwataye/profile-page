import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, X, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { BulkActions } from "@/components/admin/BulkActions";
import { CategoryAssignDialog } from "@/components/admin/CategoryAssignDialog";
import { ImageUploadManager } from "@/components/admin/ImageUploadManager";

interface Project {
  id: string;
  title: string;
  description: string;
  published: boolean;
  tech_stack: string[] | null;
  thumbnail_url: string | null;
  images: string[] | null;
}

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project_url: "",
    demo_url: "",
    published: true,
  });
  const [techStack, setTechStack] = useState<string[]>([]);
  const [newTech, setNewTech] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [existingGalleryImages, setExistingGalleryImages] = useState<string[]>([]);
  
  // Bulk operations state
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  
  // Category management state
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "", description: "", color: "#3b82f6" });
  
  // Profile photo state
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  // Logo and Favicon state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [defaultThumbnailFile, setDefaultThumbnailFile] = useState<File | null>(null);
  const [defaultThumbnailPreview, setDefaultThumbnailPreview] = useState<string | null>(null);
  const [uploadingBranding, setUploadingBranding] = useState(false);

  // Site content state
  const [siteContent, setSiteContent] = useState({
    hero_heading: "",
    hero_subtitle: "",
    about_title: "",
    about_left_heading: "",
    about_left_paragraph1: "",
    about_left_paragraph2: "",
    about_right_heading: "",
    about_services: [] as string[],
    contact_title: "",
    contact_heading: "",
    contact_description: "",
    contact_email: "",
    contact_availability: "",
    footer_text: "",
  });
  const [newService, setNewService] = useState("");
  const [savingContent, setSavingContent] = useState(false);

  // Settings state
  const [settingsData, setSettingsData] = useState({
    site_title: "",
    site_description: "",
    site_keywords: "",
    social_github: "",
    social_linkedin: "",
    social_twitter: "",
    google_analytics: "",
    maintenance_mode: false,
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      initializeAdminData();
    }
  }, [user, isAdmin]);

  const initializeAdminData = async () => {
    try {
      await Promise.all([fetchProjects(), fetchSiteSettings(), fetchCategories()]);
    } catch (error) {
      console.error("Error initializing admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .single();

      if (error) throw error;
      if (data) {
        setProfilePhotoPreview(data.profile_photo_url);
        setSiteContent({
          hero_heading: data.hero_heading || "",
          hero_subtitle: data.hero_subtitle || "",
          about_title: data.about_title || "",
          about_left_heading: data.about_left_heading || "",
          about_left_paragraph1: data.about_left_paragraph1 || "",
          about_left_paragraph2: data.about_left_paragraph2 || "",
          about_right_heading: data.about_right_heading || "",
          about_services: (Array.isArray(data.about_services) ? data.about_services : []) as string[],
          contact_title: data.contact_title || "",
          contact_heading: data.contact_heading || "",
          contact_description: data.contact_description || "",
          contact_email: data.contact_email || "",
          contact_availability: data.contact_availability || "",
          footer_text: data.footer_text || "",
        });
        setSettingsData({
          site_title: data.site_title || "",
          site_description: data.site_description || "",
          site_keywords: data.site_keywords || "",
          social_github: data.social_github || "",
          social_linkedin: data.social_linkedin || "",
          social_twitter: data.social_twitter || "",
          google_analytics: data.google_analytics || "",
          maintenance_mode: data.maintenance_mode || false,
        });
      }
    } catch (error: any) {
      console.error("Failed to load site settings:", error);
      toast.error("Failed to load site settings");
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast.error("Failed to load projects");
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Failed to load categories:", error);
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleAllProjects = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map(p => p.id));
    }
  };

  const handleBulkPublish = async () => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ published: true })
        .in("id", selectedProjects);

      if (error) throw error;
      toast.success(`${selectedProjects.length} project(s) published`);
      setSelectedProjects([]);
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to publish projects");
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ published: false })
        .in("id", selectedProjects);

      if (error) throw error;
      toast.success(`${selectedProjects.length} project(s) unpublished`);
      setSelectedProjects([]);
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to unpublish projects");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProjects.length} project(s)?`)) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .in("id", selectedProjects);

      if (error) throw error;
      toast.success(`${selectedProjects.length} project(s) deleted`);
      setSelectedProjects([]);
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to delete projects");
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.slug) {
      toast.error("Name and slug are required");
      return;
    }

    try {
      const { error } = await supabase
        .from("categories")
        .insert([newCategory]);

      if (error) throw error;
      toast.success("Category added successfully");
      setNewCategory({ name: "", slug: "", description: "", color: "#3b82f6" });
      fetchCategories();
    } catch (error: any) {
      toast.error("Failed to add category");
      console.error(error);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Category deleted");
      fetchCategories();
    } catch (error: any) {
      toast.error("Failed to delete category");
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePhotoUpload = async () => {
    if (!profilePhotoFile) {
      toast.error("Please select a photo first");
      return;
    }

    setUploadingProfile(true);

    try {
      const fileExt = profilePhotoFile.name.split('.').pop();
      const fileName = `profile-photo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-images')
        .upload(fileName, profilePhotoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('project-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("site_settings")
        .update({ profile_photo_url: publicUrl })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (updateError) throw updateError;

      toast.success("Profile photo updated successfully!");
      setProfilePhotoFile(null);
      fetchSiteSettings();
    } catch (error: any) {
      toast.error("Failed to upload profile photo");
      console.error(error);
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let thumbnail_url = null;
      let images: string[] = [];

      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(filePath, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(filePath);

        thumbnail_url = publicUrl;
      }

      // Upload gallery images
      if (galleryImages.length > 0) {
        const uploadPromises = galleryImages.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('project-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('project-images')
            .getPublicUrl(fileName);

          return publicUrl;
        });

        images = await Promise.all(uploadPromises);
      }

      const { error } = await supabase.from("projects").insert({
        ...formData,
        tech_stack: techStack.length > 0 ? techStack : null,
        thumbnail_url,
        images: images.length > 0 ? images : null,
      });

      if (error) throw error;

      toast.success("Project added successfully!");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        project_url: "",
        demo_url: "",
        published: true,
      });
      setTechStack([]);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setGalleryImages([]);
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to add project");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
      toast.success("Project deleted");
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to delete project");
      console.error(error);
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ published: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Project unpublished" : "Project published");
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to update project");
      console.error(error);
    }
  };

  const addTech = () => {
    if (newTech.trim() && !techStack.includes(newTech.trim())) {
      setTechStack([...techStack, newTech.trim()]);
      setNewTech("");
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      project_url: "",
      demo_url: "",
      published: project.published,
    });
    setTechStack(project.tech_stack || []);
    setThumbnailPreview(project.thumbnail_url);
    setExistingGalleryImages(project.images || []);
    setGalleryImages([]);
    setShowEditDialog(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProject) return;
    setSubmitting(true);

    try {
      let thumbnail_url = editingProject.thumbnail_url;
      let images = existingGalleryImages;

      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('project-images')
          .upload(filePath, thumbnailFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('project-images')
          .getPublicUrl(filePath);

        thumbnail_url = publicUrl;
      }

      // Upload new gallery images
      if (galleryImages.length > 0) {
        const uploadPromises = galleryImages.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `gallery/${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('project-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('project-images')
            .getPublicUrl(fileName);

          return publicUrl;
        });

        const newImages = await Promise.all(uploadPromises);
        images = [...images, ...newImages];
      }

      const { error } = await supabase
        .from("projects")
        .update({
          title: formData.title,
          description: formData.description,
          published: formData.published,
          tech_stack: techStack.length > 0 ? techStack : null,
          thumbnail_url,
          images: images.length > 0 ? images : null,
        })
        .eq("id", editingProject.id);

      if (error) throw error;

      toast.success("Project updated successfully!");
      setShowEditDialog(false);
      setEditingProject(null);
      setFormData({
        title: "",
        description: "",
        project_url: "",
        demo_url: "",
        published: true,
      });
      setTechStack([]);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setGalleryImages([]);
      setExistingGalleryImages([]);
      fetchProjects();
    } catch (error: any) {
      toast.error("Failed to update project");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveContent = async () => {
    setSavingContent(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update({
          ...siteContent,
          about_services: siteContent.about_services,
        })
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;
      toast.success("Page content updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update content");
      console.error(error);
    } finally {
      setSavingContent(false);
    }
  };

  const addService = () => {
    if (newService.trim() && !siteContent.about_services.includes(newService.trim())) {
      setSiteContent({
        ...siteContent,
        about_services: [...siteContent.about_services, newService.trim()],
      });
      setNewService("");
    }
  };

  const removeService = (service: string) => {
    setSiteContent({
      ...siteContent,
      about_services: siteContent.about_services.filter((s) => s !== service),
    });
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .update(settingsData)
        .eq("id", "00000000-0000-0000-0000-000000000001");

      if (error) throw error;
      toast.success("Settings updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update settings");
      console.error(error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-b from-background to-primary/5">
        <AdminSidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onLogout={handleLogout}
        />
        
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {activeSection === "overview" && "Dashboard Overview"}
              {activeSection === "projects" && "Projects Management"}
              {activeSection === "content" && "Site Content"}
              {activeSection === "profile" && "Profile Settings"}
              {activeSection === "settings" && "Admin Settings"}
            </h1>
          </header>

          <div className="flex-1 p-6">
            {/* Overview Section */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Welcome to Admin Dashboard</h2>
                  <p className="text-muted-foreground">Manage your portfolio content, projects, and settings</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-primary">{projects.length}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Published</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-green-600">
                        {projects.filter(p => p.published).length}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Drafts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-4xl font-bold text-orange-600">
                        {projects.filter(p => !p.published).length}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Projects Section */}
            {activeSection === "projects" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold">Manage Projects</h2>
                  <Button onClick={() => setShowForm(!showForm)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? "Cancel" : "Add Project"}
                  </Button>
                </div>

                {showForm && (
                  <Card className="shadow-[var(--shadow-elegant)]">
                    <CardHeader>
                      <CardTitle>Add New Project</CardTitle>
                      <CardDescription>Create a new portfolio project</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Project Title *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description *</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="thumbnail">Project Thumbnail</Label>
                          <div className="flex items-center gap-4">
                            <Input
                              id="thumbnail"
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailChange}
                              className="flex-1"
                            />
                            {thumbnailPreview && (
                              <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                                <img
                                  src={thumbnailPreview}
                                  alt="Preview"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tech">Technologies</Label>
                          <div className="flex gap-2">
                            <Input
                              id="tech"
                              value={newTech}
                              onChange={(e) => setNewTech(e.target.value)}
                              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                              placeholder="Add technology"
                            />
                            <Button type="button" onClick={addTech} variant="outline">
                              Add
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {techStack.map((tech) => (
                              <Badge key={tech} variant="secondary">
                                {tech}
                                <button
                                  type="button"
                                  onClick={() => removeTech(tech)}
                                  className="ml-2 hover:text-destructive"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            id="published"
                            checked={formData.published}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, published: checked })
                            }
                          />
                          <Label htmlFor="published">Publish immediately</Label>
                        </div>

                        <div className="flex gap-2">
                          <Button type="submit" disabled={submitting}>
                            {submitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              "Create Project"
                            )}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-4">
                  {projects.length === 0 ? (
                    <p className="text-muted-foreground">No projects yet</p>
                  ) : (
                    projects.map((project) => (
                      <Card key={project.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="text-xl font-semibold">{project.title}</h3>
                                <Badge variant={project.published ? "default" : "secondary"}>
                                  {project.published ? "Published" : "Draft"}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground mb-4">{project.description}</p>
                              {project.tech_stack && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {project.tech_stack.map((tech) => (
                                    <Badge key={tech} variant="outline">
                                      {tech}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(project)}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => togglePublished(project.id, project.published)}
                                >
                                  {project.published ? "Unpublish" : "Publish"}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(project.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                            {project.thumbnail_url && (
                              <div className="w-32 h-32 rounded-lg overflow-hidden border flex-shrink-0">
                                <img
                                  src={project.thumbnail_url}
                                  alt={project.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Profile Photo Section */}
            {activeSection === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Photo</CardTitle>
                  <CardDescription>Update your profile picture displayed on the site</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    {profilePhotoPreview && (
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary">
                        <img
                          src={profilePhotoPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoChange}
                      />
                      <Button 
                        onClick={handleProfilePhotoUpload} 
                        disabled={!profilePhotoFile || uploadingProfile}
                      >
                        {uploadingProfile ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          "Update Profile Photo"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Site Content Section */}
            {activeSection === "content" && (
              <Card>
                <CardHeader>
                  <CardTitle>Site Content Management</CardTitle>
                  <CardDescription>Edit all sections of your public portfolio page</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Hero Section */}
                  <div className="pb-6 border-b">
                    <h3 className="text-lg font-semibold mb-4">Hero Section</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="hero_heading">Main Heading</Label>
                        <Input
                          id="hero_heading"
                          value={siteContent.hero_heading}
                          onChange={(e) => setSiteContent({ ...siteContent, hero_heading: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="hero_subtitle">Subtitle</Label>
                        <Input
                          id="hero_subtitle"
                          value={siteContent.hero_subtitle}
                          onChange={(e) => setSiteContent({ ...siteContent, hero_subtitle: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* About Section */}
                  <div className="pb-6 border-b">
                    <h3 className="text-lg font-semibold mb-4">About Section</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="about_title">Section Title</Label>
                        <Input
                          id="about_title"
                          value={siteContent.about_title}
                          onChange={(e) => setSiteContent({ ...siteContent, about_title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="about_left_heading">Left Column Heading</Label>
                        <Input
                          id="about_left_heading"
                          value={siteContent.about_left_heading}
                          onChange={(e) => setSiteContent({ ...siteContent, about_left_heading: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="about_left_paragraph1">Left Column - Paragraph 1</Label>
                        <Textarea
                          id="about_left_paragraph1"
                          value={siteContent.about_left_paragraph1}
                          onChange={(e) => setSiteContent({ ...siteContent, about_left_paragraph1: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="about_left_paragraph2">Left Column - Paragraph 2</Label>
                        <Textarea
                          id="about_left_paragraph2"
                          value={siteContent.about_left_paragraph2}
                          onChange={(e) => setSiteContent({ ...siteContent, about_left_paragraph2: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="about_right_heading">Right Column Heading</Label>
                        <Input
                          id="about_right_heading"
                          value={siteContent.about_right_heading}
                          onChange={(e) => setSiteContent({ ...siteContent, about_right_heading: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Services List</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={newService}
                            onChange={(e) => setNewService(e.target.value)}
                            placeholder="Add a service"
                            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                          />
                          <Button type="button" onClick={addService} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {siteContent.about_services.map((service, idx) => (
                            <Badge key={idx} variant="secondary" className="flex items-center gap-2">
                              {service}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => removeService(service)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div className="pb-6 border-b">
                    <h3 className="text-lg font-semibold mb-4">Contact Section</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="contact_title">Section Title</Label>
                        <Input
                          id="contact_title"
                          value={siteContent.contact_title}
                          onChange={(e) => setSiteContent({ ...siteContent, contact_title: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_heading">Heading</Label>
                        <Input
                          id="contact_heading"
                          value={siteContent.contact_heading}
                          onChange={(e) => setSiteContent({ ...siteContent, contact_heading: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_description">Description</Label>
                        <Textarea
                          id="contact_description"
                          value={siteContent.contact_description}
                          onChange={(e) => setSiteContent({ ...siteContent, contact_description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_email">Email Address</Label>
                        <Input
                          id="contact_email"
                          type="email"
                          value={siteContent.contact_email}
                          onChange={(e) => setSiteContent({ ...siteContent, contact_email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="contact_availability">Available For</Label>
                        <Input
                          id="contact_availability"
                          value={siteContent.contact_availability}
                          onChange={(e) => setSiteContent({ ...siteContent, contact_availability: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Footer</h3>
                    <div>
                      <Label htmlFor="footer_text">Company/Brand Name</Label>
                      <Input
                        id="footer_text"
                        value={siteContent.footer_text}
                        onChange={(e) => setSiteContent({ ...siteContent, footer_text: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleSaveContent} 
                    disabled={savingContent}
                    className="w-full"
                  >
                    {savingContent ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save All Changes"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Settings Section */}
            {activeSection === "settings" && (
              <div className="space-y-6">
                {/* SEO Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>SEO & Meta Tags</CardTitle>
                    <CardDescription>Configure search engine optimization settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="site_title">Site Title</Label>
                      <Input
                        id="site_title"
                        value={settingsData.site_title}
                        onChange={(e) => setSettingsData({ ...settingsData, site_title: e.target.value })}
                        placeholder="Your Portfolio - Professional Developer"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Appears in browser tabs and search results
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="site_description">Site Description</Label>
                      <Textarea
                        id="site_description"
                        value={settingsData.site_description}
                        onChange={(e) => setSettingsData({ ...settingsData, site_description: e.target.value })}
                        placeholder="Professional nocode developer specializing in rapid application development..."
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Used in search engine results (150-160 characters recommended)
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="site_keywords">Keywords</Label>
                      <Input
                        id="site_keywords"
                        value={settingsData.site_keywords}
                        onChange={(e) => setSettingsData({ ...settingsData, site_keywords: e.target.value })}
                        placeholder="nocode, developer, portfolio, web development"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Comma-separated keywords relevant to your work
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Media Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                    <CardDescription>Connect your social media profiles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="social_github">GitHub URL</Label>
                      <Input
                        id="social_github"
                        value={settingsData.social_github}
                        onChange={(e) => setSettingsData({ ...settingsData, social_github: e.target.value })}
                        placeholder="https://github.com/yourusername"
                        type="url"
                      />
                    </div>
                    <div>
                      <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                      <Input
                        id="social_linkedin"
                        value={settingsData.social_linkedin}
                        onChange={(e) => setSettingsData({ ...settingsData, social_linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/yourprofile"
                        type="url"
                      />
                    </div>
                    <div>
                      <Label htmlFor="social_twitter">Twitter/X URL</Label>
                      <Input
                        id="social_twitter"
                        value={settingsData.social_twitter}
                        onChange={(e) => setSettingsData({ ...settingsData, social_twitter: e.target.value })}
                        placeholder="https://twitter.com/yourusername"
                        type="url"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Analytics & Tracking */}
                <Card>
                  <CardHeader>
                    <CardTitle>Analytics & Tracking</CardTitle>
                    <CardDescription>Monitor your site's performance and visitor behavior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="google_analytics">Google Analytics ID</Label>
                      <Input
                        id="google_analytics"
                        value={settingsData.google_analytics}
                        onChange={(e) => setSettingsData({ ...settingsData, google_analytics: e.target.value })}
                        placeholder="G-XXXXXXXXXX"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter your Google Analytics measurement ID
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Site Maintenance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Site Maintenance</CardTitle>
                    <CardDescription>Control site availability and maintenance mode</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                          Display a maintenance page to visitors (admins can still access)
                        </p>
                      </div>
                      <Switch
                        id="maintenance_mode"
                        checked={settingsData.maintenance_mode}
                        onCheckedChange={(checked) =>
                          setSettingsData({ ...settingsData, maintenance_mode: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Branding Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Branding Assets</CardTitle>
                    <CardDescription>Upload and manage your logo and favicon</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Logo Upload */}
                    <div className="space-y-4">
                      <Label htmlFor="logo">Website Logo</Label>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <Input
                            id="logo"
                            type="file"
                            accept="image/svg+xml,image/png,image/jpeg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setLogoFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setLogoPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Recommended: SVG format, transparent background
                          </p>
                        </div>
                        {logoPreview && (
                          <div className="w-32 h-16 border rounded-lg p-2 bg-muted flex items-center justify-center">
                            <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Favicon Upload */}
                    <div className="space-y-4">
                      <Label htmlFor="favicon">Favicon</Label>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <Input
                            id="favicon"
                            type="file"
                            accept="image/svg+xml,image/png,image/x-icon"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setFaviconFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setFaviconPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Recommended: 32x32px SVG or PNG format
                          </p>
                        </div>
                        {faviconPreview && (
                          <div className="w-16 h-16 border rounded-lg p-2 bg-muted flex items-center justify-center">
                            <img src={faviconPreview} alt="Favicon preview" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Default Thumbnail Upload */}
                    <div className="space-y-4">
                      <Label htmlFor="defaultThumbnail">Default Project Thumbnail</Label>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <Input
                            id="defaultThumbnail"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setDefaultThumbnailFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setDefaultThumbnailPreview(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Used for projects without custom thumbnails
                          </p>
                        </div>
                        {defaultThumbnailPreview && (
                          <div className="w-32 h-24 border rounded-lg p-2 bg-muted flex items-center justify-center">
                            <img src={defaultThumbnailPreview} alt="Default thumbnail preview" className="max-w-full max-h-full object-cover rounded" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Button */}
                    {(logoFile || faviconFile || defaultThumbnailFile) && (
                      <Button
                        onClick={async () => {
                          setUploadingBranding(true);
                          try {
                            let logoUrl = null;
                            let faviconUrl = null;
                            let defaultThumbnailUrl = null;

                            // Upload logo
                            if (logoFile) {
                              const logoPath = `branding/logo-${Date.now()}.${logoFile.name.split('.').pop()}`;
                              const { error: logoError } = await supabase.storage
                                .from('project-images')
                                .upload(logoPath, logoFile);

                              if (logoError) throw logoError;

                              const { data: logoData } = supabase.storage
                                .from('project-images')
                                .getPublicUrl(logoPath);
                              logoUrl = logoData.publicUrl;
                            }

                            // Upload favicon
                            if (faviconFile) {
                              const faviconPath = `branding/favicon-${Date.now()}.${faviconFile.name.split('.').pop()}`;
                              const { error: faviconError } = await supabase.storage
                                .from('project-images')
                                .upload(faviconPath, faviconFile);

                              if (faviconError) throw faviconError;

                              const { data: faviconData } = supabase.storage
                                .from('project-images')
                                .getPublicUrl(faviconPath);
                              faviconUrl = faviconData.publicUrl;
                            }

                            // Upload default thumbnail
                            if (defaultThumbnailFile) {
                              const thumbnailPath = `branding/default-thumbnail-${Date.now()}.${defaultThumbnailFile.name.split('.').pop()}`;
                              const { error: thumbnailError } = await supabase.storage
                                .from('project-images')
                                .upload(thumbnailPath, defaultThumbnailFile);

                              if (thumbnailError) throw thumbnailError;

                              const { data: thumbnailData } = supabase.storage
                                .from('project-images')
                                .getPublicUrl(thumbnailPath);
                              defaultThumbnailUrl = thumbnailData.publicUrl;
                            }

                            // Update site_settings with new URLs
                            const updates: any = {};
                            if (logoUrl) updates.logo_url = logoUrl;
                            if (faviconUrl) updates.favicon_url = faviconUrl;
                            if (defaultThumbnailUrl) updates.default_thumbnail_url = defaultThumbnailUrl;

                            const { error: updateError } = await supabase
                              .from('site_settings')
                              .update(updates)
                              .eq('id', (await supabase.from('site_settings').select('id').single()).data?.id);

                            if (updateError) throw updateError;

                            toast.success('Branding assets uploaded successfully');
                            setLogoFile(null);
                            setLogoPreview(null);
                            setFaviconFile(null);
                            setFaviconPreview(null);
                            setDefaultThumbnailFile(null);
                            setDefaultThumbnailPreview(null);
                            fetchSiteSettings();
                          } catch (error: any) {
                            console.error('Error uploading branding assets:', error);
                            toast.error('Failed to upload branding assets');
                          } finally {
                            setUploadingBranding(false);
                          }
                        }}
                        disabled={uploadingBranding}
                        className="w-full"
                      >
                        {uploadingBranding ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          'Upload Branding Assets'
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Save Button */}
                <Button 
                  onClick={handleSaveSettings} 
                  disabled={savingSettings}
                  className="w-full"
                  size="lg"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving Settings...
                    </>
                  ) : (
                    "Save All Settings"
                  )}
                </Button>
              </div>
            )}
          </div>
        </SidebarInset>

        {/* Edit Project Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>Update project details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Project Title *</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-thumbnail">Project Thumbnail</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="edit-thumbnail"
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="flex-1"
                  />
                  {thumbnailPreview && (
                    <div className="relative w-20 h-20 rounded-md overflow-hidden border">
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-tech">Technologies</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-tech"
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
                    placeholder="Add technology"
                  />
                  <Button type="button" onClick={addTech} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {techStack.map((tech) => (
                    <Badge key={tech} variant="secondary">
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTech(tech)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-published"
                  checked={formData.published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, published: checked })
                  }
                />
                <Label htmlFor="edit-published">Published</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Project"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default Admin;
