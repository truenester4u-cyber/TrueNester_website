# Floor Plans, Payment Plan & Handover Feature - Setup Guide

## ✅ What's Been Added

### 1. Property Detail Page (`src/pages/PropertyDetail.tsx`)

#### **Floor Plans Section** 🏗️
- Interactive floor plan viewer with:
  - Left sidebar: List of all floor plans (clickable)
  - Right side: Large floor plan image display
  - **Zoom controls**: Mouse wheel to zoom in/out (1x to 3x)
  - **Pan/Drag**: Click and drag when zoomed in to move around
  - **Double-click**: Reset zoom and position
  - Zoom indicator showing current zoom level
  - Instructions overlay for user guidance
  - Smooth transitions and animations
  - Professional styling with gradient header

#### **Payment Plan & Handover Section** 💰
- Beautiful section with:
  - Special gradient heading with Playfair Display font
  - Decorative underline effect
  - Gradient background cards for payment plan and handover date
  - Conditional rendering (only shows if data exists)

### 2. Admin Panel (`src/pages/admin/PropertyForm.tsx`)

#### **Floor Plans Management** 📋
- New "Floor Plans" card section with:
  - Plan Title input
  - Size input (e.g., "778 to 1,156 sq. ft.")
  - Image URL input
  - Add/Remove floor plans dynamically
  - Preview of added floor plans

#### **Payment Plan & Handover** 📅
- Form section with:
  - Payment Plan textarea (supports multi-line text)
  - Handover Date input field
  - Helper text for guidance

### 3. Database Migration (`database-migrations/add_payment_handover_fields.sql`)
- SQL script ready to add three new columns:
  - `payment_plan` (TEXT)
  - `handover_date` (TEXT)
  - `floor_plans` (JSONB array)

## 🚀 Quick Setup (2 minutes)

### Step 1: Run Database Migration

1. Open **Supabase Dashboard** → Your Project
2. Click **SQL Editor** in sidebar
3. Click **New Query**
4. Copy and paste this:

```sql
-- Add payment_plan, handover_date, and floor_plans fields to properties table

ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS payment_plan TEXT,
ADD COLUMN IF NOT EXISTS handover_date TEXT,
ADD COLUMN IF NOT EXISTS floor_plans JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.properties.payment_plan IS 'Payment plan details for the property (e.g., percentage breakdowns, installment schedule)';
COMMENT ON COLUMN public.properties.handover_date IS 'Expected handover date for the property (e.g., Q4 2025, December 2025)';
COMMENT ON COLUMN public.properties.floor_plans IS 'Array of floor plan objects with title, size, and image URL. Example: [{"title": "1 Bedroom Apartment", "size": "778 to 1,156 sq. ft.", "image": "https://..."}]';
```

5. Click **Run** (or press `Ctrl+Enter`)
6. Wait for success message ✅

### Step 2: Test in Admin Panel

1. Go to `/admin/properties`
2. Create new property or edit existing one
3. Scroll down to find **"Floor Plans"** section
4. Add floor plans:
   - **Plan Title**: e.g., "1 Bedroom Apartment"
   - **Size**: e.g., "778 to 1,156 sq. ft."
   - **Image URL**: Paste the floor plan image URL
   - Click **Add Floor Plan**
   - Repeat for multiple plans
5. Fill in **"Payment Plan & Handover"** section:
   - **Payment Plan**: e.g., "20% on booking, 40% during construction, 40% on handover"
   - **Handover Date**: e.g., "Q4 2025" or "December 2025"
6. Save the property

### Step 3: View on Property Detail Page

1. Navigate to the property detail page
2. Scroll down below the tabs
3. You'll see the interactive **FLOORPLANS** section:
   - Click any floor plan on the left to view it
   - Use mouse wheel to zoom in/out
   - Click and drag to pan around when zoomed
   - Double-click to reset view
   - Use the zoom controls on the right
4. Below that, the **PAYMENT PLAN & HANDOVER** section with:
   - Elegant heading with gradient text
   - Payment plan in a styled card
   - Handover date prominently displayed

## 🎨 Design Features

### Floor Plans Viewer
- **Two-panel layout**: Plans list on left, image viewer on right
- **Interactive controls**:
  - Mouse wheel zoom (1x to 3x)
  - Click and drag to pan when zoomed
  - Double-click to reset
  - Zoom in/out buttons
  - Reset button
- **Visual feedback**:
  - Selected plan highlighted in primary color
  - Zoom percentage indicator
  - Instructions overlay
  - Smooth transitions
- **Professional styling**: Gradient header with Playfair Display font

### Payment Plan & Handover Styling
- **Font**: Playfair Display (serif, elegant)
- **Size**: 4xl (very large and prominent)
- **Effect**: Gradient from primary to primary/60 with text-transparent clip
- **Accent**: Horizontal gradient line underneath

### Content Cards
- **Background**: Gradient from primary/5 to primary/10
- **Border**: Primary color with 20% opacity
- **Padding**: Generous spacing for readability
- **Border Radius**: Rounded corners (xl)

### Responsive Design
- Works perfectly on mobile, tablet, and desktop
- Floor plans stack vertically on mobile
- Proper spacing and alignment
- Touch-friendly controls

## 📝 Example Data

### Floor Plans Example:
```json
[
  {
    "title": "1 Bedroom Apartment",
    "size": "778 to 1,156 sq. ft.",
    "image": "https://example.com/floorplan1.jpg"
  },
  {
    "title": "2 Bedroom + Study Apartments",
    "size": "1,275 sq. ft to 1,477 sq. ft.",
    "image": "https://example.com/floorplan2.jpg"
  },
  {
    "title": "2 Bedrooms Apartments",
    "size": "1,185 to 1,407 sq. ft.",
    "image": "https://example.com/floorplan3.jpg"
  }
]
```

### Payment Plan Example:
```
20% on Booking
40% During Construction
40% on Handover

Payment schedule:
- 10% on booking confirmation
- 10% within 30 days
- 20% on 25% construction completion
- 20% on 50% construction completion
- 40% on final handover
```

### Handover Date Examples:
- `Q4 2025`
- `December 2025`
- `Ready to Move`
- `Under Construction - Expected Q2 2026`

## ✨ Features

### Floor Plans Viewer
1. **Interactive Zoom**: Scroll wheel to zoom 1x to 3x
2. **Pan & Drag**: Click and drag when zoomed to explore details
3. **Quick Reset**: Double-click or reset button to return to default view
4. **Multiple Plans**: Easy switching between different floor plan types
5. **Visual Feedback**: Selected plan highlighted, zoom level indicator
6. **User-Friendly**: Instructions overlay guides users
7. **Smooth Animations**: Professional transitions and interactions

### Payment Plan & Handover
1. **Conditional Display**: Only shows if data exists
2. **Special Typography**: Playfair Display font for premium look
3. **Gradient Effects**: Modern gradient backgrounds and text
4. **Clean Layout**: Professional spacing and organization
5. **Mobile Responsive**: Perfect on all screen sizes

## 🎯 Usage Tips

### Floor Plans
- Use high-resolution floor plan images (at least 1200px wide)
- Consistent image sizes work best
- Clear, professional architectural drawings
- Add multiple plans for different unit types
- Use descriptive titles (e.g., "2 Bedroom + Study Apartments")
- Include size ranges in the format "X to Y sq. ft."

### Payment Plan & Handover
- Keep payment plans clear and concise
- Use bullet points or line breaks for better readability
- Format handover dates consistently (e.g., always "Q# YYYY")
- Test on mobile devices to ensure readability

## 🖱️ User Interaction Guide

**Floor Plan Viewer Controls:**
- **Mouse Wheel**: Zoom in/out
- **Click & Drag**: Pan around when zoomed in
- **Double-Click**: Reset zoom and position
- **+ Button**: Zoom in
- **- Button**: Zoom out
- **Reset Button**: Return to default view

---

**All set!** Run the migration and start adding payment plans to your properties. 🎉
