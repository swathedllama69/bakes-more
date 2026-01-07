# 📸 Instagram Gallery Setup Guide

## ✅ What's Been Created

### 1. **Database Table** (`supabase/migrations/20260107_create_gallery.sql`)
   - Stores Instagram posts with images, captions, and metadata
   - Supports featured posts and custom ordering
   - Public read access, authenticated admin access

### 2. **Admin Management Page** (`/gallery`)
   - Add Instagram posts by pasting URLs
   - Mark posts as featured (⭐ gold badge)
   - View post thumbnails and captions
   - Delete posts from gallery
   - Direct links to Instagram

### 3. **Public Gallery Section** (Homepage)
   - Beautiful masonry grid layout
   - Animated entrance effects
   - Lightbox view for full-size images
   - Featured badge for special posts
   - "Follow on Instagram" CTA

### 4. **Instagram Fetch API** (`/api/instagram/oembed`)
   - Uses Instagram's public oEmbed endpoint
   - No API key required!
   - Automatically extracts thumbnails and captions

---

## 🚀 Setup Instructions

### Step 1: Run the Database Migration

In Supabase Dashboard:
1. Go to **SQL Editor**
2. Click **New Query**
3. Copy the contents of `supabase/migrations/20260107_create_gallery.sql`
4. Click **Run** to create the gallery table

### Step 2: Add Your First Post

1. Go to your admin panel: **`/gallery`**
2. On Instagram:
   - Open a post you want to feature
   - Click the three dots (•••) → **Copy Link**
3. Paste the URL in the input box
4. Click **Add to Gallery**
5. ✅ The post will appear instantly!

### Step 3: Manage Your Gallery

- **Feature Posts**: Click the star button to highlight special items
- **Delete Posts**: Click the trash icon to remove
- **View on Instagram**: Click "View Post" to see the original
- **Reorder**: Posts appear in order of featured status, then most recent

---

## 📱 How It Works

### For You (Admin):
1. Copy any Instagram post URL
2. Paste it in `/gallery` admin page
3. System fetches image and caption automatically
4. Post appears on your homepage immediately

### For Your Customers:
1. Visit your website
2. See beautiful gallery section
3. Click any image for full-size view
4. Click "View on Instagram" to engage
5. Follow your Instagram directly from site

---

## 🎨 Features

### Admin Panel (`/gallery`):
- ✨ Drag-free management
- 🌟 Featured posts (gold badge)
- 🗑️ One-click delete
- 👁️ Preview before publish
- 🔗 Direct Instagram links

### Public Gallery (Homepage):
- 📱 Responsive masonry layout
- ✨ Smooth animations
- 🖼️ Lightbox viewer
- ⭐ Featured badges
- 📲 Instagram CTAs
- 🚀 Loads latest 12 posts

---

## 💡 Pro Tips

### Best Practices:
1. **Feature Your Best Work**: Use the star button for wedding cakes, special orders
2. **Mix Content**: Show variety - cakes, cupcakes, desserts, behind-the-scenes
3. **Keep Fresh**: Add new posts regularly (1-2 per week)
4. **Caption Strategy**: Instagram captions show in lightbox - use them!
5. **Mobile First**: Gallery looks amazing on phones (where most customers browse)

### What to Post:
- ✅ Finished cakes with beautiful presentation
- ✅ Close-up shots of decoration details
- ✅ Customer celebration moments
- ✅ Process videos (if Instagram Reels)
- ✅ Seasonal/holiday specials

### What to Avoid:
- ❌ Blurry or dark photos
- ❌ Too many similar items in a row
- ❌ Posts without cake/product in frame
- ❌ Overly promotional captions

---

## 🔧 Customization Options

### Change Grid Layout:
In `src/components/GallerySection.tsx`, line 63:
```tsx
{/* Change columns for different layouts */}
<div className="columns-1 md:columns-2 lg:columns-3 gap-4">
  {/* lg:columns-4 for more columns */}
  {/* md:columns-3 for mobile grids */}
</div>
```

### Change Number of Posts:
Line 19:
```tsx
.limit(12)  // Change to show more/fewer posts
```

### Change Brand Colors:
Gallery uses your existing brand colors:
- Featured badges: `#D4AF37` (gold)
- Hover effects: `#B03050` (red)
- Backgrounds: `#FDFBF7` (cream)

---

## 🐛 Troubleshooting

### "Failed to fetch Instagram post"
- ✅ Make sure URL is from Instagram (instagram.com/p/...)
- ✅ Post must be public (not private account)
- ✅ URL should be complete (https://...)

### Image not loading
- ✅ Instagram sometimes blocks embeds - try different post
- ✅ Very old posts may not work - use recent ones
- ✅ Check if post was deleted from Instagram

### Gallery not showing on homepage
- ✅ Make sure you've added at least one post
- ✅ Check that migration was run successfully
- ✅ Verify gallery_items table exists in Supabase

---

## 🎯 Quick Start Checklist

- [ ] Run database migration in Supabase
- [ ] Go to `/gallery` admin page
- [ ] Add 6-12 Instagram posts
- [ ] Mark 2-3 as featured (⭐)
- [ ] Visit homepage to see gallery live
- [ ] Share homepage with customers!

---

## 🚀 Future Enhancements (Optional)

If you want to upgrade later:
1. **Auto-sync**: Fetch new posts automatically from Instagram API
2. **Categories**: Filter by cake types, events, etc.
3. **Customer Favorites**: Let visitors "like" designs
4. **Direct Ordering**: "Order similar" button on each post
5. **Analytics**: Track which designs get most views

---

## 📞 Need Help?

The gallery is live and ready to use! Just:
1. Run the migration
2. Start adding posts
3. Watch your gallery grow! 🎉

**Navigation**: Admin Sidebar → Gallery (📷 icon)
