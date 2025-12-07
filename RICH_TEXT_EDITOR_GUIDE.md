# Rich Text Editor - Complete Guide

## Overview
The TrueNester Rich Text Editor is a professional WYSIWYG editor built with TipTap for creating beautifully formatted property descriptions. It matches modern real estate website standards like Bayut, Property Finder, and Dubizzle.

## ✨ Features

### 1. Text Formatting
- **Bold** (Ctrl+B / Cmd+B)
- *Italic* (Ctrl+I / Cmd+I)
- <u>Underline</u> (Ctrl+U / Cmd+U)
- ~~Strikethrough~~
- Text colors (12 color palette)
- Text highlighting (8 highlight colors)

### 2. Headings
- H1 - Main titles
- H2 - Section headers
- H3 - Subsection headers

### 3. Lists
- Bullet lists
- Numbered lists
- Nested lists support

### 4. Alignment
- Left align
- Center align
- Right align

### 5. Media & Links
- **Insert Links** (Ctrl+K / Cmd+K)
  - URL input with validation
  - Optional link text
  - Open in new tab option
- **Insert Images**
  - Image URL support
  - Automatic responsive sizing
  - Shadow and rounded corners

### 6. Tables (Ctrl+Shift+T / Cmd+Shift+T)
- Custom rows and columns
- Header row styling
- Add/remove rows and columns dynamically
- Hover effects
- Mobile responsive

### 7. Advanced Features
- **Blockquotes** - Styled quotations
- **Code blocks** - For technical content
- **Horizontal Rules** - Visual separators
- **Clear Formatting** - Remove all styling
- **Undo/Redo** - Full history support

### 8. Editor Tools
- **Live Preview** - Side-by-side view (desktop)
- **Word Counter** - Track content length
- **Character Counter** - Detailed statistics
- **Auto-save** - Saves every 30 seconds
- **Save Status** - Visual indicator (red dot for unsaved changes)
- **Last Saved** - Timestamp display
- **Copy HTML** - Export formatted content
- **Download as Text** - Plain text export

## 🎨 Design

### Color Scheme
- **Primary Green**: `#00a86b` (Active buttons, brand color)
- **Blue Accent**: `#0066cc` (Links)
- **Hover Effect**: Light green background `hover:bg-green-50`
- **Active State**: White text on green background

### Typography
- **Font**: Inter, Segoe UI, system-ui
- **Base Size**: 16px (15px on mobile)
- **Line Height**: 1.7 for readability

### Responsive Toolbar
- Desktop: Full toolbar with all buttons
- Tablet: Collapsible sections
- Mobile: Essential tools visible

## 📖 Usage

### In Admin Panel (Property Form)

```tsx
import RichTextEditor from "@/components/admin/RichTextEditor";

<RichTextEditor
  content={formData.description}
  onChange={(html) => setFormData({ ...formData, description: html })}
  placeholder="Write a detailed description for your property..."
  minHeight="400px"
/>
```

### On Main Website (Property Detail)

The description renders automatically with rich formatting:

```tsx
<div 
  className="property-description"
  dangerouslySetInnerHTML={{ __html: property.description || '' }}
/>
```

## 🔧 Technical Details

### Dependencies
```json
{
  "@tiptap/react": "^3.11.0",
  "@tiptap/starter-kit": "^3.11.0",
  "@tiptap/extension-link": "^3.11.0",
  "@tiptap/extension-image": "^3.11.0",
  "@tiptap/extension-text-align": "^3.11.0",
  "@tiptap/extension-underline": "^3.11.0",
  "@tiptap/extension-text-style": "^3.11.0",
  "@tiptap/extension-color": "^3.11.0",
  "@tiptap/extension-table": "^3.11.0",
  "@tiptap/extension-table-row": "^3.11.0",
  "@tiptap/extension-table-cell": "^3.11.0",
  "@tiptap/extension-table-header": "^3.11.0",
  "@tiptap/extension-highlight": "^3.11.0"
}
```

### File Structure
```
src/
├── components/
│   └── admin/
│       ├── RichTextEditor.tsx (Main component)
│       └── RichTextEditorStyles.css (Website display styles)
└── pages/
    ├── admin/
    │   ├── PropertyForm.tsx (Uses editor)
    │   └── BlogPostForm.tsx (Uses editor)
    └── PropertyDetail.tsx (Displays formatted content)
```

### State Management
```typescript
const [showPreview, setShowPreview] = useState(false);
const [linkModalOpen, setLinkModalOpen] = useState(false);
const [tableModalOpen, setTableModalOpen] = useState(false);
const [lastSaved, setLastSaved] = useState<Date | null>(null);
const [isSaving, setIsSaving] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` / `Cmd+B` | **Bold** |
| `Ctrl+I` / `Cmd+I` | *Italic* |
| `Ctrl+U` / `Cmd+U` | Underline |
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |
| `Ctrl+K` / `Cmd+K` | Insert Link |
| `Ctrl+Shift+T` / `Cmd+Shift+T` | Insert Table |

## 🎯 Best Practices

### Writing Property Descriptions

1. **Start with a compelling headline (H1)**
   ```
   Luxury 3-Bedroom Penthouse with Stunning Dubai Marina Views
   ```

2. **Use sections with H2/H3**
   ```
   ## Key Features
   ### Modern Kitchen
   ### Spacious Living Areas
   ```

3. **Bullet points for amenities**
   ```
   • 24/7 Security
   • Swimming Pool
   • Gym & Fitness Center
   ```

4. **Tables for pricing/plans**
   | Unit Type | Size | Price |
   |-----------|------|-------|
   | Studio | 450 sq ft | AED 800,000 |
   | 1 BR | 750 sq ft | AED 1,200,000 |

5. **Add calls-to-action**
   ```
   [Schedule a Viewing](https://example.com/contact)
   ```

### SEO Tips
- Use H1 for main title (one per page)
- Structure content with H2/H3 subheadings
- Include location keywords naturally
- Write descriptive link text
- Aim for 300-500 words minimum

## 🎨 Styling on Website

The CSS file `RichTextEditorStyles.css` ensures content looks professional:

- **Links**: Blue color with underline animation
- **Tables**: Hover effects, rounded corners, shadow
- **Blockquotes**: Green left border, light background
- **Code**: Pink inline code, gray code blocks
- **Images**: Rounded corners, shadow, responsive
- **Lists**: Green bullets (brand color)

## 🔒 Security

- Uses `dangerouslySetInnerHTML` with caution
- Content sanitization recommended for user input
- Only admin panel users can create/edit content
- Supabase Row Level Security (RLS) enforces access control

## 📱 Mobile Optimization

### Editor (Admin Panel)
- Stacked layout (no side-by-side preview)
- Simplified toolbar with most-used tools
- Touch-friendly button sizes (minimum 44x44px)

### Display (Website)
- Responsive images (max-width: 100%)
- Smaller font sizes on mobile (15px)
- Adjusted heading sizes
- Tables scroll horizontally if needed

## 🐛 Troubleshooting

### Editor not loading
```bash
# Reinstall TipTap extensions
npm install @tiptap/extension-table @tiptap/extension-highlight
```

### Styles not applying
```tsx
// Ensure CSS is imported
import "@/components/admin/RichTextEditorStyles.css";
```

### Content not saving
- Check `hasUnsavedChanges` state
- Verify Supabase connection
- Check browser console for errors

## 🚀 Future Enhancements

- [ ] PDF export functionality
- [ ] Image upload to Supabase Storage
- [ ] Video embed support
- [ ] Table of contents generation
- [ ] Markdown import/export
- [ ] Collaboration features (real-time editing)
- [ ] Version history
- [ ] Content templates
- [ ] AI-powered writing suggestions

## 📚 Additional Resources

- [TipTap Documentation](https://tiptap.dev/)
- [Bayut Design Patterns](https://www.bayut.com/)
- [Property Finder Style Guide](https://www.propertyfinder.ae/)

## 📝 Example Property Description

```html
<h1>Modern 2-Bedroom Apartment in Downtown Dubai</h1>

<p>Experience luxury living in the heart of Dubai's most prestigious address. This stunning 2-bedroom apartment offers breathtaking views of the Burj Khalifa and Dubai Fountain.</p>

<h2>Key Features</h2>

<ul>
  <li>1,200 sq ft of premium living space</li>
  <li>Floor-to-ceiling windows</li>
  <li>High-end Italian kitchen</li>
  <li>2 dedicated parking spaces</li>
  <li>Smart home technology</li>
</ul>

<h2>Building Amenities</h2>

<table>
  <tr>
    <th>Amenity</th>
    <th>Details</th>
  </tr>
  <tr>
    <td>Swimming Pool</td>
    <td>Infinity pool on 50th floor</td>
  </tr>
  <tr>
    <td>Gym</td>
    <td>State-of-the-art equipment</td>
  </tr>
  <tr>
    <td>Concierge</td>
    <td>24/7 service</td>
  </tr>
</table>

<blockquote>
  "This is not just an apartment, it's a lifestyle statement." - Forbes Real Estate
</blockquote>

<p><a href="/contact">Schedule a viewing today!</a></p>
```

---

**Version**: 1.0.0  
**Last Updated**: December 1, 2025  
**Support**: Contact TrueNester Development Team
