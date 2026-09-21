export const studio = {
  brand: "Content X",
  founder: "Abhinav Rai",
  email: "abhinavvrai@gmail.com",
  whatsapp: "https://wa.me/917987909860?text=Hi%20Abhinav%2C%20I%27d%20like%20to%20start%20a%20video%20project%20with%20Content%20X.",
  hero: {
    eyebrow: "Managed content production · private review workspace",
    title: ["Create.", "Review.", "Publish."],
    copy: "Premium video editing with one organized place for footage, versions, timestamped feedback, approvals, and final delivery.",
    primary: "Choose a package",
    secondary: "Explore the workspace"
  },
  stats: [
    { value: "1,000+", label: "videos delivered" },
    { value: "20+", label: "clients served" },
    { value: "48–72h", label: "typical first cut" }
  ],
  cases: [
    { id: "premium1", category: "premium", title: "Kinetic Retention Edit", label: "Premium · 1080p", tier: "Premium", src: "videos/premium1.mp4", posterTime: 2.8, copy: "Hyper-focused retention pacing, custom motion typography, and sound design." },
    { id: "premium2", category: "premium", title: "High-Energy Brand Short", label: "Premium · 1080p", tier: "Premium", src: "videos/premium2.mp4", posterTime: 2.4, copy: "Punchy visual transitions, seamless B-roll sequencing, and dynamic zooms." },
    { id: "premium3", category: "premium", title: "Motion Story Feature", label: "Premium · 1080p", tier: "Premium", src: "videos/premium3.mp4", posterTime: 2.6, copy: "Flagship vertical cut built to capture cold audiences within 2 seconds." },
    { id: "standard1", category: "standard", title: "Creator Talking-Head Cut", label: "Standard · 720p", tier: "Standard", src: "videos/standard1.mp4", posterTime: 2.5, copy: "Crisp caption styling, jump cuts with zero dead air, and highlighted hooks." },
    { id: "standard2", category: "standard", title: "Educational Reel Pacing", label: "Standard · 720p", tier: "Standard", src: "videos/standard2.mp4", posterTime: 2.2, copy: "Visual pattern interrupts, relevant screen popups, and smooth sound effects." },
    { id: "standard3", category: "standard", title: "Engaging Narrative Story", label: "Standard · 720p", tier: "Standard", src: "videos/standard3.mp4", posterTime: 2.6, copy: "Rhythmic pacing with branded subtitles and audio leveling." },
    { id: "quick1", category: "quick", title: "Fast-Paced Social Short", label: "Social Fast · 720p", tier: "Fast Cut", src: "videos/quick1.mp4", posterTime: 2.0, copy: "Speedy social delivery ready for TikTok, Instagram Reels, and YouTube Shorts." },
    { id: "quick2", category: "quick", title: "Viral Hook Formula Reel", label: "Social Fast · 720p", tier: "Fast Cut", src: "videos/quick2.mp4", posterTime: 2.4, copy: "Formulaic hook test edit designed for maximum short-form completion rate." },
    { id: "quick3", category: "quick", title: "Subtitled Speech Flow", label: "Social Fast · 720p", tier: "Fast Cut", src: "videos/quick3.mp4", posterTime: 2.2, copy: "Clean Hormozi-style animated word-by-word subtitles and punchy SFX." },
    { id: "quick4", category: "quick", title: "High-Speed Punch Edit", label: "Social Fast · 720p", tier: "Fast Cut", src: "videos/quick4.mp4", posterTime: 2.0, copy: "Fast cuts and kinetic overlays designed for product reveals and announcements." },
    { id: "video4", category: "landscape", title: "Landscape Brand Walkthrough", label: "YouTube · 16:9", tier: "Landscape", src: "videos/video4.mp4", posterTime: 3.0, copy: "Full widescreen commercial pacing, multi-track audio balancing, and chapter cuts." },
    { id: "video6", category: "standard", title: "Product Feature Breakdown", label: "Standard · 720p", tier: "Standard", src: "videos/video6.mp4", posterTime: 2.5, copy: "Clear visual callouts, smooth background tracks, and branded lower-thirds." }
  ],
  workflow: [
    { step: "01", title: "Upload", copy: "Drop raw footage, brand assets, references and your brief into a private project folder." },
    { step: "02", title: "First cut", copy: "We edit for the platform, audience and outcome—then notify you when it is ready." },
    { step: "03", title: "Review", copy: "Watch in the browser and leave comments pinned automatically to the exact frame." },
    { step: "04", title: "Approve", copy: "Compare versions, request changes or approve the final cut from one clean workspace." }
  ],
  plans: [
    {
      title: "Basic",
      price: "₹1,500",
      note: "per short-form video",
      description: "For clean, simple reels with captions and light engagement elements.",
      features: ["Clean edit & pacing", "Captions and subtitles", "Stickers and emojis", "Light sound effects", "1 revision round"]
    },
    {
      title: "Standard",
      price: "₹2,000–₹2,500",
      note: "per short-form video",
      description: "For videos that need more visual energy.",
      featured: true,
      features: ["B-roll cutaways", "Sound effects", "Custom typography", "Colour grading", "Optional motion graphics +₹500"]
    },
    {
      title: "Premium",
      price: "₹3,500–₹5,000",
      note: "per short-form video",
      description: "For high-retention, flagship content.",
      features: ["Retention-led structure", "Premium B-roll and sound", "Motion titles", "Optional advanced motion +₹1,500", "3 revision rounds"]
    },
    {
      title: "Custom / Monthly",
      price: "Let’s talk",
      note: "retainers & one-off projects",
      description: "A tailored system for brands, creators and agencies.",
      features: ["Volume-based pricing", "Long-form & campaign work", "Dedicated project folders", "Flexible turnaround"]
    }
  ],
  faqs: [
    ["How do revisions work?", "Revision rounds follow your package: Basic includes 1, Standard includes 2 and Premium includes 3. Additional rounds are ₹300 for short-form and ₹500 for long-form."],
    ["Where do I send my footage?", "After your project is confirmed, your private workspace unlocks. Upload footage, logos, fonts, references and briefs directly into its folders."],
    ["Can my team review a video?", "Yes. Share a secure review link so teammates can watch, comment at exact timestamps and approve without downloading the file."],
    ["Do you offer monthly packages?", "Yes. Monthly retainers are quoted around your video volume, complexity and turnaround requirements."],
    ["Can I use WhatsApp?", "Absolutely. New project enquiries and quick updates can happen on WhatsApp; the workspace keeps files and feedback organized."]
  ]
};

export const demoProjects = [
  { id: "apex", name: "Apex Fitness Launch", client: "Apex Fitness", type: "12 short-form videos", progress: 72, status: "In review", due: "Aug 8", color: "#ff6b35", files: 24 },
  { id: "founder", name: "Founder Story Series", client: "Nivara Studio", type: "6 founder-led reels", progress: 38, status: "Editing", due: "Aug 12", color: "#8b5cf6", files: 18 },
  { id: "product", name: "Product Walkthrough", client: "Orbit Labs", type: "Launch video", progress: 100, status: "Approved", due: "Delivered", color: "#24b47e", files: 31 }
];

export const demoComments = [
  { id: 1, author: "Meera", initials: "MK", time: 4.2, text: "Could we open with the product close-up? It feels like the strongest hook.", age: "12 min", resolved: false },
  { id: 2, author: "Abhinav", initials: "AR", time: 12.8, text: "Yes—I'll bring that shot forward and tighten this transition in V4.", age: "8 min", resolved: false },
  { id: 3, author: "Rohan", initials: "RS", time: 21.4, text: "Caption is approved. Please keep this styling across the remaining videos.", age: "3 min", resolved: true }
];
