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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  Strikethrough,
  List, 
  ListOrdered, 
  Heading1,
  Heading2, 
  Heading3,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
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
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = "Write a detailed description for your property...",
  minHeight = "300px" 
}: RichTextEditorProps) => {
  const [showPreview, setShowPreview] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [tableRows, setTableRows] = useState("3");
  const [tableCols, setTableCols] = useState("3");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const colors = [
    "#000000", "#333333", "#666666", "#999999",
    "#00a86b", "#0066cc", "#ff6b6b", "#ffd93d",
    "#6bcf7f", "#a29bfe", "#fd79a8", "#fdcb6e"
  ];

  const highlightColors = [
    "#ffeb3b", "#ffcdd2", "#c8e6c9", "#b3e5fc",
    "#f8bbd0", "#d1c4e9", "#ffe0b2", "#f5f5f5"
  ];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline cursor-pointer hover:text-blue-800",
          target: "_blank",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg shadow-md",
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
          class: "border border-gray-300 bg-gray-100 font-bold p-2",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 p-2",
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setHasUnsavedChanges(true);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none p-4 min-h-[${minHeight}]`,
        placeholder: placeholder,
      },
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !editor) return;

    const timer = setTimeout(() => {
      setIsSaving(true);
      // Simulate save
      setTimeout(() => {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        setIsSaving(false);
      }, 500);
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(timer);
  }, [hasUnsavedChanges, editor]);

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
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const insertLink = useCallback(() => {
    if (!editor || !linkUrl) return;

    if (linkText) {
      editor.chain().focus().insertContent(`<a href="${linkUrl}" target="${linkNewTab ? '_blank' : '_self'}">${linkText}</a>`).run();
    } else {
      editor.chain().focus().setLink({ href: linkUrl, target: linkNewTab ? '_blank' : '_self' }).run();
    }

    setLinkModalOpen(false);
    setLinkUrl("");
    setLinkText("");
  }, [editor, linkUrl, linkText, linkNewTab]);

  const insertTable = useCallback(() => {
    if (!editor) return;
    
    const rows = parseInt(tableRows) || 3;
    const cols = parseInt(tableCols) || 3;
    
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableModalOpen(false);
    setTableRows("3");
    setTableCols("3");
  }, [editor, tableRows, tableCols]);

  const copyToClipboard = () => {
    if (!editor) return;
    navigator.clipboard.writeText(editor.getHTML());
    alert("Content copied to clipboard!");
  };

  const downloadAsText = () => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-description.txt';
    a.click();
  };

  const getWordCount = () => {
    if (!editor) return 0;
    return editor.getText().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = () => {
    if (!editor) return 0;
    return editor.getText().length;
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
    return null;
  }

  const addLink = () => {
    const url = window.prompt("Enter URL");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between p-3 bg-white border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isSaving && <Save className="h-4 w-4 text-green-600 animate-pulse" />}
            {hasUnsavedChanges && !isSaving && <div className="h-2 w-2 bg-red-500 rounded-full" title="Unsaved changes" />}
            <span className="text-sm text-gray-600">Last saved: {formatLastSaved()}</span>
          </div>
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
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy HTML
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadAsText}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
        {/* Editor Section */}
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
          <div className="bg-gray-50 p-3 border-b flex flex-wrap gap-1 sticky top-0 z-10">
            {/* Text Formatting */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={editor.isActive("underline") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Underline (Ctrl+U)"
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive("strike") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>

            {/* Headings */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive("heading", { level: 1 }) ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Heading 1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive("heading", { level: 2 }) ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Heading 2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive("heading", { level: 3 }) ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Heading 3"
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>

            {/* Colors & Highlight */}
            <div className="flex gap-1 border-r pr-2 relative">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                className="hover:bg-green-50"
                title="Text Color"
              >
                <Palette className="h-4 w-4" />
              </Button>
              {colorPickerOpen && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-20 grid grid-cols-4 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setColorPickerOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setHighlightPickerOpen(!highlightPickerOpen)}
                className={editor.isActive("highlight") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Highlight"
              >
                <Highlighter className="h-4 w-4" />
              </Button>
              {highlightPickerOpen && (
                <div className="absolute top-full left-0 mt-1 p-2 bg-white border rounded-lg shadow-lg z-20 grid grid-cols-4 gap-1">
                  {highlightColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().toggleHighlight({ color }).run();
                        setHighlightPickerOpen(false);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Lists */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive("orderedList") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Alignment */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Links & Media */}
            <div className="flex gap-1 border-r pr-2">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => setLinkModalOpen(true)}
                className="hover:bg-green-50"
                title="Insert Link (Ctrl+K)"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={addImage}
                className="hover:bg-green-50"
                title="Insert Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTableModalOpen(true)}
                className={editor.isActive("table") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Insert Table (Ctrl+Shift+T)"
              >
                <TableIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Table Controls (show when in table) */}
            {editor.isActive("table") && (
              <div className="flex gap-1 border-r pr-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  className="hover:bg-green-50"
                  title="Add Row Before"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="hover:bg-green-50"
                  title="Add Column After"
                >
                  <TableProperties className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="hover:bg-red-50 text-red-600"
                  title="Delete Row"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Advanced */}
            <div className="flex gap-1 border-r pr-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={editor.isActive("blockquote") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Quote"
              >
                <Quote className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive("code") ? "bg-[#00a86b] text-white hover:bg-[#008f5b]" : "hover:bg-green-50"}
                title="Inline Code"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="hover:bg-green-50"
                title="Horizontal Line"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
                className="hover:bg-green-50"
                title="Clear Formatting"
              >
                <RemoveFormatting className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1" />

            {/* Undo/Redo */}
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                className="hover:bg-green-50 disabled:opacity-50"
                title="Undo (Ctrl+Z)"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                className="hover:bg-green-50 disabled:opacity-50"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Editor Content */}
          <EditorContent 
            editor={editor} 
            className="prose prose-sm max-w-none p-6 focus-within:outline-none bg-white overflow-auto"
            style={{ minHeight }}
          />

          {/* Stats Bar */}
          <div className="bg-gray-50 px-4 py-2 border-t flex justify-between text-sm text-gray-600">
            <span>{getWordCount()} words</span>
            <span>{getCharCount()} characters</span>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <div className="bg-gray-50 px-4 py-3 border-b font-semibold text-sm">
              Live Preview
            </div>
            <div 
              className="prose prose-sm max-w-none p-6 overflow-auto"
              style={{ minHeight }}
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          </div>
        )}
      </div>

      {/* Link Modal */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
            <DialogDescription>
              Add a hyperlink to your text. The link will open in a new tab by default.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="newtab"
                checked={linkNewTab}
                onCheckedChange={(checked) => setLinkNewTab(checked as boolean)}
              />
              <label
                htmlFor="newtab"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Open in new tab
              </label>
            </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insert Table</DialogTitle>
            <DialogDescription>
              Create a table with custom rows and columns. The first row will be the header.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <div className="text-sm text-gray-600">
              Tip: After inserting, click inside the table to see additional controls for adding/removing rows and columns.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTableModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={insertTable}>
              Insert Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RichTextEditor;
