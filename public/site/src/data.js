export const studio = {
  brand: "Content X",
  founder: "Abhinav Rai",
  email: "abhinavvrai@gmail.com",
  whatsapp: "https://wa.me/917987909860?text=Hi%20Abhinav%2C%20I%27d%20like%20to%20start%20a%20video%20project%20with%20Content%20X.",
  hero: {
    eyebrow: "Video production + client review workspace",
    title: ["Create.", "Review.", "Publish."],
    copy: "Premium video editing with one organized place for footage, versions, timestamped feedback, approvals, and final delivery.",
    primary: "Start on WhatsApp",
    secondary: "Explore the workspace"
  },
  stats: [
    { value: "1,000+", label: "videos delivered" },
    { value: "20+", label: "clients served" },
    { value: "48–72h", label: "typical first cut" }
  ],
  cases: [
    { title: "Premium Reels", label: "Kinetic edit", src: "videos/premium1.mp4", copy: "Motion, sound design, captions and retention-led pacing." },
    { title: "Brand Shorts", label: "Launch content", src: "videos/premium2.mp4", copy: "High-energy vertical edits built to stop the scroll." },
    { title: "Story Cuts", label: "Creator narrative", src: "videos/standard3.mp4", copy: "Clear storytelling, clean captions and purposeful rhythm." },
    { title: "Fast Turnarounds", label: "Social ready", src: "videos/quick1.mp4", copy: "A polished edit that is ready to publish, without the wait." }
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
      description: "For clean, consistent social content.",
      features: ["Clean edit & pacing", "Basic captions", "Music & simple transitions", "2 revision rounds"]
    },
    {
      title: "Standard",
      price: "₹2,000–₹2,500",
      note: "per short-form video",
      description: "For videos that need more visual energy.",
      featured: true,
      features: ["Everything in Basic", "Advanced captions", "Stock footage & visual layers", "Sound design", "2 revision rounds"]
    },
    {
      title: "Premium",
      price: "₹3,500",
      note: "per short-form video",
      description: "For high-retention, flagship content.",
      features: ["Strategy-led hook", "Premium motion graphics", "Advanced sound & colour", "Priority delivery", "2 revision rounds"]
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
    ["How do revisions work?", "Every project includes two revision rounds. Additional rounds are ₹300 each, agreed before work begins."],
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
