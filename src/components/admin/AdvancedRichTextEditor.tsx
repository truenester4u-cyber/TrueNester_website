import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Highlight } from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import FontFamily from "@tiptap/extension-font-family";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  List, 
  ListOrdered,
  ListChecks,
  Heading1,
  Heading2, 
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Quote,
  Code,
  Minus,
  Table as TableIcon,
  Highlighter,
  Palette,
  FileDown,
  Copy,
  Eye,
  EyeOff,
  Save,
  TableProperties,
  Plus,
  Trash2,
  RemoveFormatting,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Search,
  Type,
  ImagePlus,
  Youtube,
  Smile,
  DollarSign,
  Clock,
  User,
  History,
  Settings,
  ChevronDown,
  Upload,
  FileText,
  Download,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdvancedRichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
  propertyId?: string;
}

interface EditVersion {
  id: string;
  content: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export const AdvancedRichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = "Write a detailed description for your property...",
  minHeight = "400px",
  propertyId
}: AdvancedRichTextEditorProps) => {
  // UI States
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  
  // Form States
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkType, setLinkType] = useState("external");
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  
  // Editor States
  const [fontSize, setFontSize] = useState("16");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [versions, setVersions] = useState<EditVersion[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Colors and Fonts
  const textColors = [
    "#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
    "#00a86b", "#0066cc", "#ff6b6b", "#ffd93d", "#6bcf7f", "#a29bfe",
    "#fd79a8", "#fdcb6e", "#e17055", "#00b894"
  ];

  const highlightColors = [
    "#ffeb3b", "#ffcdd2", "#c8e6c9", "#b3e5fc", "#f8bbd0", 
    "#d1c4e9", "#ffe0b2", "#f5f5f5", "#ffccbc", "#b2dfdb"
  ];

  const fontFamilies = [
    { label: "Inter", value: "Inter, sans-serif" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Times New Roman", value: "Times New Roman, serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Courier New", value: "Courier New, monospace" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Trebuchet", value: "Trebuchet MS, sans-serif" },
    { label: "Comic Sans", value: "Comic Sans MS, cursive" },
  ];

  const fontSizes = ["12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72"];

  const symbols = ["©", "®", "™", "°", "±", "×", "÷", "≠", "≤", "≥", "←", "→", "↑", "↓", "€", "$", "£", "¥", "₹", "AED"];
  
  const emojis = ["😀", "😃", "😄", "😁", "🏠", "🏢", "🏗️", "🛏️", "🚿", "🍳", "🌇", "🌃", "⭐", "✨", "🎉", "👍", "❤️", "🔥"];

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  // TipTap Editor Configuration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg shadow-md my-4",
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 bg-gray-100 font-bold p-3",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 p-3",
        },
      }),
      Subscript,
      Superscript,
      FontFamily.configure({
        types: ['textStyle'],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setHasUnsavedChanges(true);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-6 min-h-[${minHeight}]`,
        style: `font-size: ${fontSize}px; font-family: ${fontFamily};`,
      },
    },
  });

  // Ensure editor reflects latest content when editing existing descriptions
  useEffect(() => {
    if (!editor) return;
    const incoming = content || "";
    const current = editor.getHTML();

    if (incoming !== current) {
      editor.commands.setContent(incoming);
      setHasUnsavedChanges(false);
    }
  }, [content, editor]);

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !editor) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        // Save to Supabase if propertyId exists
        if (propertyId && currentUser) {
          const version: EditVersion = {
            id: Date.now().toString(),
            content: editor.getHTML(),
            timestamp: new Date(),
            userId: currentUser.id,
            userName: currentUser.user_metadata?.full_name || currentUser.email || "Unknown",
            userAvatar: currentUser.user_metadata?.avatar_url,
          };
          
          setVersions(prev => [version, ...prev].slice(0, 20)); // Keep last 20 versions
        }
        
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setIsSaving(false);
      } catch (error) {
        console.error("Auto-save error:", error);
        setIsSaving(false);
      }
    }, 20000); // Auto-save every 20 seconds

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, editor, propertyId, currentUser]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editor) return;
      
      // Ctrl+K for link
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setLinkModalOpen(true);
      }
      
      // Ctrl+Shift+T for table
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setTableModalOpen(true);
      }

      // Ctrl+F for find
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFindReplaceOpen(true);
      }

      // Ctrl+H for find & replace
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setFindReplaceOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  // Insert Link
  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;

    let finalUrl = linkUrl;
    if (linkType === "email") {
      finalUrl = `mailto:${linkUrl}`;
    } else if (linkType === "phone") {
      finalUrl = `tel:${linkUrl}`;
    }

    if (linkText) {
      editor.chain().focus().insertContent(`<a href="${finalUrl}" target="${linkNewTab ? '_blank' : '_self'}">${linkText}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: finalUrl, target: linkNewTab ? '_blank' : '_self' }).run();
    }

    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  }, [editor, linkUrl, linkText, linkType, linkNewTab]);

  // Insert Table
  const insertTable = useCallback(() => {
    if (!editor) return;
    
    const rows = parseInt(tableRows) || 3;
    const cols = parseInt(tableCols) || 3;
    
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableModalOpen(false);
    setTableRows("3");
    setTableCols("3");
  }, [editor, tableRows, tableCols]);

  // Insert Table Templates
  const insertTableTemplate = (template: string) => {
    if (!editor) return;
    
    if (template === "amenities") {
      editor.chain().focus().insertContent(`
        <table>
          <tr><th>Amenity</th><th>Available</th></tr>
          <tr><td>Swimming Pool</td><td>✓</td></tr>
          <tr><td>Gym</td><td>✓</td></tr>
          <tr><td>Parking</td><td>✓</td></tr>
          <tr><td>Security</td><td>✓</td></tr>
        </table>
      `).run();
    } else if (template === "pricing") {
      editor.chain().focus().insertContent(`
        <table>
          <tr><th>Unit Type</th><th>Size</th><th>Price (AED)</th></tr>
          <tr><td>Studio</td><td>450 sq ft</td><td>800,000</td></tr>
          <tr><td>1 BR</td><td>750 sq ft</td><td>1,200,000</td></tr>
          <tr><td>2 BR</td><td>1,100 sq ft</td><td>1,800,000</td></tr>
        </table>
      `).run();
    } else if (template === "floorplans") {
      editor.chain().focus().insertContent(`
        <table>
          <tr><th>Floor Plan</th><th>Bedrooms</th><th>Bathrooms</th><th>Size</th></tr>
          <tr><td>Plan A</td><td>1</td><td>1</td><td>650 sq ft</td></tr>
          <tr><td>Plan B</td><td>2</td><td>2</td><td>950 sq ft</td></tr>
          <tr><td>Plan C</td><td>3</td><td>2</td><td>1,250 sq ft</td></tr>
        </table>
      `).run();
    }
    setTableModalOpen(false);
  };

  // Upload Image
  const handleImageUpload = async () => {
    if (!imageFile && !imageUrl) return;

    try {
      let finalUrl = imageUrl;

      if (imageFile) {
        // Upload to Supabase Storage
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('property-images')
          .upload(fileName, imageFile);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(fileName);

        finalUrl = publicUrl;
      }

      editor?.chain().focus().setImage({ src: finalUrl }).run();
      setImageModalOpen(false);
      setImageUrl("");
      setImageFile(null);
      
      toast({
        title: "Image inserted",
        description: "Image has been added to your content",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Insert Video Embed
  const insertVideo = () => {
    if (!editor || !videoUrl) return;

    let embedUrl = videoUrl;
    
    // Convert YouTube URL
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convert Vimeo URL
    if (videoUrl.includes('vimeo.com')) {
      const videoId = videoUrl.match(/vimeo\.com\/(\d+)/)?.[1];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    editor.chain().focus().insertContent(`
      <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 1.5rem 0;">
        <iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      </div>
    `).run();

    setVideoModalOpen(false);
    setVideoUrl("");
  };

  // Find and Replace
  const findAndReplace = () => {
    if (!editor || !findText) return;
    
    const html = editor.getHTML();
    const newHtml = html.replace(new RegExp(findText, 'gi'), replaceText);
    editor.commands.setContent(newHtml);
    
    toast({
      title: "Replace complete",
      description: `Replaced all occurrences of "${findText}"`,
    });
  };

  // Export Functions
  const exportAsHTML = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-description.html';
    a.click();
  };

  const exportAsText = () => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-description.txt';
    a.click();
  };

  const copyToClipboard = () => {
    if (!editor) return;
    navigator.clipboard.writeText(editor.getHTML());
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  // Statistics
  const getWordCount = () => {
    if (!editor) return 0;
    return editor.getText().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = () => {
    if (!editor) return 0;
    return editor.getText().length;
  };

  const getReadingTime = () => {
    const words = getWordCount();
    const minutes = Math.ceil(words / 200); // Average reading speed
    return minutes;
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "Never";
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return lastSaved.toLocaleDateString();
  };

  if (!editor) {
    return <div className="p-8 text-center">Loading editor...</div>;
  }

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isSaving && <Save className="h-4 w-4 text-green-600 animate-pulse" />}
            {hasUnsavedChanges && !isSaving && (
              <div className="h-2 w-2 bg-red-500 rounded-full" title="Unsaved changes" />
            )}
            <span className="text-sm text-gray-600">
              {isSaving ? "Saving..." : `Last saved: ${formatLastSaved()}`}
            </span>
          </div>
          
          {currentUser && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Avatar className="h-6 w-6">
                <AvatarImage src={currentUser.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-green-600 text-white text-xs">
                  {currentUser.user_metadata?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span>{currentUser.user_metadata?.full_name || currentUser.email}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="gap-2"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setVersionHistoryOpen(true)}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsHTML}>
                <FileText className="h-4 w-4 mr-2" />
                Download HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsText}>
                <FileDown className="h-4 w-4 mr-2" />
                Download Text
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg text-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Type className="h-4 w-4 text-gray-500" />
            <span>{getWordCount()} words</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span>{getCharCount()} characters</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span>{getReadingTime()} min read</span>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className={`grid ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {/* Editor Section */}
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          {/* Toolbar */}
          <Tabs defaultValue="format" className="w-full">
            <div className="bg-gray-50 border-b">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="insert">Insert</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
                <TabsTrigger value="tools">Tools</TabsTrigger>
              </TabsList>
            </div>

            {/* Format Tab */}
            <TabsContent value="format" className="p-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Font Family */}
                <Select value={fontFamily} onValueChange={(value) => {
                  setFontFamily(value);
                  editor.chain().focus().setFontFamily(value).run();
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Font Size */}
                <Select value={fontSize} onValueChange={setFontSize}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}px
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Separator orientation="vertical" className="h-6" />

                {/* Text Formatting */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive("bold") ? "bg-[#00a86b] text-white" : ""}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive("italic") ? "bg-[#00a86b] text-white" : ""}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={editor.isActive("underline") ? "bg-[#00a86b] text-white" : ""}
                  title="Underline (Ctrl+U)"
                >
                  <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={editor.isActive("strike") ? "bg-[#00a86b] text-white" : ""}
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                {/* Subscript/Superscript */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleSubscript().run()}
                  className={editor.isActive("subscript") ? "bg-[#00a86b] text-white" : ""}
                >
                  <SubIcon className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleSuperscript().run()}
                  className={editor.isActive("superscript") ? "bg-[#00a86b] text-white" : ""}
                >
                  <SupIcon className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                {/* Text Color */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" title="Text Color">
                      <Palette className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-8 gap-1">
                      {textColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => editor.chain().focus().setColor(color).run()}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Highlight */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={editor.isActive("highlight") ? "bg-[#00a86b] text-white" : ""}
                      title="Highlight"
                    >
                      <Highlighter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-5 gap-1">
                      {highlightColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className="w-8 h-8 rounded border hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-6" />

                {/* Headings */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Heading1 className="h-4 w-4" />
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
                      <Heading1 className="h-4 w-4 mr-2" /> Heading 1
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
                      <Heading2 className="h-4 w-4 mr-2" /> Heading 2
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
                      <Heading3 className="h-4 w-4 mr-2" /> Heading 3
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
                      Heading 4
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}>
                      Heading 5
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}>
                      Heading 6
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Separator orientation="vertical" className="h-6" />

                {/* Alignment */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('left').run()}
                  className={editor.isActive({ textAlign: 'left' }) ? "bg-[#00a86b] text-white" : ""}
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('center').run()}
                  className={editor.isActive({ textAlign: 'center' }) ? "bg-[#00a86b] text-white" : ""}
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('right').run()}
                  className={editor.isActive({ textAlign: 'right' }) ? "bg-[#00a86b] text-white" : ""}
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                  className={editor.isActive({ textAlign: 'justify' }) ? "bg-[#00a86b] text-white" : ""}
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                {/* Lists */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={editor.isActive("bulletList") ? "bg-[#00a86b] text-white" : ""}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={editor.isActive("orderedList") ? "bg-[#00a86b] text-white" : ""}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                {/* Clear Formatting */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                  title="Clear Formatting"
                >
                  <RemoveFormatting className="h-4 w-4" />
                </Button>

                {/* Undo/Redo */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            {/* Insert Tab */}
            <TabsContent value="insert" className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkModalOpen(true)}
                  className="gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setImageModalOpen(true)}
                  className="gap-2"
                >
                  <ImagePlus className="h-4 w-4" />
                  Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVideoModalOpen(true)}
                  className="gap-2"
                >
                  <Youtube className="h-4 w-4" />
                  Video
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTableModalOpen(true)}
                  className="gap-2"
                >
                  <TableIcon className="h-4 w-4" />
                  Table
                </Button>
                
                <Separator orientation="vertical" className="h-6" />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Smile className="h-4 w-4" />
                      Emoji
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-6 gap-2">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className="text-2xl hover:bg-gray-100 p-1 rounded"
                          onClick={() => editor.chain().focus().insertContent(emoji).run()}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      Symbols
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-5 gap-2">
                      {symbols.map((symbol) => (
                        <button
                          key={symbol}
                          type="button"
                          className="text-xl hover:bg-gray-100 p-2 rounded"
                          onClick={() => editor.chain().focus().insertContent(symbol).run()}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  className={`gap-2 ${editor.isActive("blockquote") ? "bg-[#00a86b] text-white" : ""}`}
                >
                  <Quote className="h-4 w-4" />
                  Quote
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  className="gap-2"
                >
                  <Minus className="h-4 w-4" />
                  Divider
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`gap-2 ${editor.isActive("code") ? "bg-[#00a86b] text-white" : ""}`}
                >
                  <Code className="h-4 w-4" />
                  Code
                </Button>
              </div>
            </TabsContent>

            {/* Table Tab */}
            <TabsContent value="table" className="p-3">
              {editor.isActive("table") ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().addRowBefore().run()}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Row Above
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Row Below
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().addColumnBefore().run()}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Column Left
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Column Right
                  </Button>
                  
                  <Separator orientation="vertical" className="h-6" />
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Row
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Column
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    className="gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Table
                  </Button>

                  <Separator orientation="vertical" className="h-6" />

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editor.chain().focus().mergeCells().run()}
                    className="gap-2"
                  >
                    <TableProperties className="h-4 w-4" />
                    Merge Cells
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  Click inside a table to see table editing options
                </div>
              )}
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFindReplaceOpen(true)}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Find & Replace
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Editor Content */}
          <ScrollArea className="h-[500px]">
            <EditorContent 
              editor={editor} 
              className="prose prose-sm max-w-none p-6 focus-within:outline-none bg-white"
            />
          </ScrollArea>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b font-semibold text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Live Preview
            </div>
            <ScrollArea className="h-[500px]">
              <div 
                className="property-description prose prose-sm max-w-none p-6"
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Add a hyperlink to your content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Link Type</Label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="external">External Link</SelectItem>
                  <SelectItem value="email">Email Address</SelectItem>
                  <SelectItem value="phone">Phone Number</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">
                {linkType === 'email' ? 'Email Address' : linkType === 'phone' ? 'Phone Number' : 'URL'} *
              </Label>
              <Input
                id="url"
                type={linkType === 'email' ? 'email' : linkType === 'phone' ? 'tel' : 'url'}
                placeholder={
                  linkType === 'email' ? 'email@example.com' : 
                  linkType === 'phone' ? '+971501234567' : 
                  'https://example.com'
                }
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linktext">Link Text (optional)</Label>
              <Input
                id="linktext"
                placeholder="Click here"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
            {linkType === 'external' && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newtab"
                  checked={linkNewTab}
                  onCheckedChange={(checked) => setLinkNewTab(checked as boolean)}
                />
                <label htmlFor="newtab" className="text-sm font-medium">
                  Open in new tab
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertLink} disabled={!linkUrl}>
              Insert Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Modal */}
      <Dialog open={tableModalOpen} onOpenChange={setTableModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
            <DialogDescription>
              Create a custom table or use a template
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="custom" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="custom">Custom</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
            </TabsList>
            <TabsContent value="custom" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="rows">Number of Rows</Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="20"
                  value={tableRows}
                  onChange={(e) => setTableRows(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cols">Number of Columns</Label>
                <Input
                  id="cols"
                  type="number"
                  min="1"
                  max="10"
                  value={tableCols}
                  onChange={(e) => setTableCols(e.target.value)}
                />
              </div>
              <Button onClick={insertTable} className="w-full">
                Insert Table
              </Button>
            </TabsContent>
            <TabsContent value="templates" className="space-y-2 pt-4">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => insertTableTemplate('amenities')}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Amenities List
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => insertTableTemplate('pricing')}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Price Comparison
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => insertTableTemplate('floorplans')}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Floor Plans
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insert Image</DialogTitle>
            <DialogDescription>
              Upload an image or provide a URL
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="space-y-4 pt-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG up to 10MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setImageFile(file);
                }}
              />
              {imageFile && (
                <p className="text-sm text-gray-600">
                  Selected: {imageFile.name}
                </p>
              )}
              <Button onClick={handleImageUpload} disabled={!imageFile} className="w-full">
                Upload & Insert
              </Button>
            </TabsContent>
            <TabsContent value="url" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="imageurl">Image URL</Label>
                <Input
                  id="imageurl"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleImageUpload} disabled={!imageUrl} className="w-full">
                Insert Image
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={videoModalOpen} onOpenChange={setVideoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Embed Video</DialogTitle>
            <DialogDescription>
              Add a YouTube or Vimeo video
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="videourl">Video URL</Label>
              <Input
                id="videourl"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Supports YouTube and Vimeo links
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertVideo} disabled={!videoUrl}>
              Embed Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Find & Replace Modal */}
      <Dialog open={findReplaceOpen} onOpenChange={setFindReplaceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find & Replace</DialogTitle>
            <DialogDescription>
              Search and replace text in your content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="find">Find</Label>
              <Input
                id="find"
                placeholder="Search text..."
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replace">Replace with</Label>
              <Input
                id="replace"
                placeholder="Replacement text..."
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFindReplaceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={findAndReplace} disabled={!findText}>
              Replace All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      <Dialog open={versionHistoryOpen} onOpenChange={setVersionHistoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and restore previous versions
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 pr-4">
            {versions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No version history available yet
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version) => (
                  <div 
                    key={version.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      editor?.commands.setContent(version.content);
                      setVersionHistoryOpen(false);
                      toast({
                        title: "Version restored",
                        description: `Restored version from ${version.timestamp.toLocaleString()}`,
                      });
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={version.userAvatar} />
                        <AvatarFallback className="bg-green-600 text-white text-xs">
                          {version.userName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{version.userName}</span>
                          <span className="text-xs text-gray-500">
                            {version.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {version.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvancedRichTextEditor;
