import { supabase } from './db.js'

async function seed() {
  console.log('🌱 Seeding SDC database...')

  // ── Stats ──────────────────────────────────────────────
  const { error: statsErr } = await supabase.from('stats').upsert([{
    active_members: '150+',
    workshops_run: '24+',
    projects_shipped: '35+',
    hackathons_won: '12+',
  }])
  if (statsErr) console.error('stats:', statsErr.message)
  else console.log('✅ stats seeded')

  // ── Members ─────────────────────────────────────────────
  const { error: membersErr } = await supabase.from('members').upsert([
    { name: 'Dr. Abhijeet Gaonkar', role: 'Faculty Coordinator', initials: 'AG', member_type: 'faculty', dept: 'Faculty of Engineering & Technology', sort_order: 1 },
    { name: 'TBD Faculty', role: 'Faculty Coordinator', initials: 'TF', member_type: 'faculty', dept: 'Faculty of Engineering & Technology', sort_order: 2 },
    { name: 'Tanishq Naik', role: '', initials: 'TN', member_type: 'student', sort_order: 1 },
    { name: 'Shriyansh Narvekar', role: '', initials: 'SN', member_type: 'student', sort_order: 2 },
    { name: 'Yash Mukade', role: '', initials: 'YM', member_type: 'student', sort_order: 3 },
    { name: 'Priyal Nagvekar', role: '', initials: 'PN', member_type: 'student', sort_order: 4 },
    { name: 'Shravan Bhise', role: '', initials: 'SB', member_type: 'student', sort_order: 5 },
    { name: 'Raziya Sultana', role: '', initials: 'RS', member_type: 'student', sort_order: 6 },
    { name: 'Bhramay', role: '', initials: 'BS', member_type: 'student', sort_order: 7 },
    { name: 'Abhimanyu Dixit', role: '', initials: 'AD', member_type: 'student', sort_order: 8 },
    { name: 'Aaryan Kumar Tiwari', role: '', initials: 'AT', member_type: 'student', sort_order: 9 },
  ])
  if (membersErr) console.error('members:', membersErr.message)
  else console.log('✅ members seeded')

  // ── Projects ────────────────────────────────────────────
  const { error: projErr } = await supabase.from('projects').upsert([
    { title: 'Aura GL', description: 'High-performance audio particle visualizer running 3D compute shaders in WebGL2, rendering 250,000 real-time particles with custom GLSL gravitational attractors at 60 FPS.', github_url: 'https://github.com/sdc-club/aura-gl', submitted_by: 'Aarav Patel & Graphics Lab', status: 'approved', tags: ['WebGL', 'GLSL', 'Three.js'] },
    { title: 'Orbit KV', description: 'Distributed key-value store optimized for campus edge caches with zero cold-starts, CRDT active replication, and sub-2ms edge read latencies on Cloudflare Workers.', github_url: 'https://github.com/sdc-club/orbit-kv', submitted_by: 'Devon Chen & Systems Team', status: 'approved', tags: ['Rust', 'Cloudflare', 'CRDT'] },
    { title: 'NeuralSchedule', description: 'Constraint satisfaction neural solver engine resolving prerequisite clashes, catalog requirements, and timetable conflicts for multi-department university catalogs.', github_url: 'https://github.com/sdc-club/neural-schedule', submitted_by: 'Maya Lin & AI Core', status: 'approved', tags: ['Python', 'PyTorch', 'FastAPI'] },
    { title: 'PulseAuth', description: 'Decentralized cryptographic credential wallet for privately verifying campus workshop attendance and hackathon certificates using Ed25519 signatures & WebAuthn.', github_url: 'https://github.com/sdc-club/pulse-auth', submitted_by: 'Liam Vance & Security Lab', status: 'approved', tags: ['WebAuthn', 'Ed25519', 'Security'] },
    { title: 'EdgeLog', description: 'Real-time telemetry pipeline and analytics hub streaming 50,000 sensor metrics per second with sub-second in-memory aggregations via DuckDB WebAssembly.', github_url: 'https://github.com/sdc-club/edgelog', submitted_by: 'Elena Rostova & Cloud Core', status: 'approved', tags: ['DuckDB', 'WASM', 'Analytics'] },
    { title: 'ChromaCode', description: 'Browser-based collaborative code editor featuring sub-15ms peer-to-peer cursor synchronization and audio channels directly over a WebRTC data mesh.', github_url: 'https://github.com/sdc-club/chromacode', submitted_by: 'Marcus Vance & Web Team', status: 'approved', tags: ['WebRTC', 'React', 'Collab'] },
  ])
  if (projErr) console.error('projects:', projErr.message)
  else console.log('✅ projects seeded')

  // ── Events ──────────────────────────────────────────────
  const { error: evtErr } = await supabase.from('events').upsert([
    { title: 'Portfolio Launch Workshop', description: 'Deploy your first full-stack app to Cloudflare Pages. 100-point judging rubric.', category: 'Workshops', event_date: '2026-09-24T17:00:00Z', location: 'Lab 402 / Online', spots_left: 12, featured: true },
    { title: 'React Three Fiber & Shaders', description: 'GLSL fundamentals, R3F setup, and creating interactive 3D WebGL scenes.', category: 'Workshops', event_date: '2026-10-04T18:00:00Z', location: 'Design Studio B', spots_left: 24, featured: false },
    { title: 'Hackathon: Open Source for Good', description: '48 hours. Build something that helps your campus community. $2,500 prize pool.', category: 'Hackathons', event_date: '2026-10-18T09:00:00Z', location: 'Innovation Hub', spots_left: 45, featured: false },
    { title: 'Talk: Careers in AI/ML & Systems', description: 'Panel with research engineers and founders. Live Q&A and networking session.', category: 'Talks', event_date: '2026-11-08T16:00:00Z', location: 'Auditorium 1', spots_left: 80, featured: false },
    { title: 'Code Review & Demo Night', description: 'Bring your PRs and side projects. Get live feedback from senior student builders.', category: 'Social', event_date: '2026-11-22T18:00:00Z', location: 'Student Center Rooftop', spots_left: 30, featured: false },
  ])
  if (evtErr) console.error('events:', evtErr.message)
  else console.log('✅ events seeded')

  // ── Blogs ───────────────────────────────────────────────
  const { error: blogErr } = await supabase.from('blogs').upsert([
    {
      title: 'Welcome to SDC Fall 2026: The Black Hole Roadmap',
      excerpt: 'A new semester, a new team, and a roadmap that starts with WebGL gravitational lensing and ends with production shipped code.',
      content: "Welcome to another semester of building at the Student Developer Club! This semester, we're doubling down on production-grade projects, open source development, and high-impact campus tech. Check out the event gallery below from our kickoff orientation.",
      author: 'Aarav Mehta (President)',
      tag: 'Community',
      read_time: '4 min read',
      image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
      photos: [
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80'
      ],
      published_at: '2026-09-18T00:00:00Z'
    },
    {
      title: 'Summer 2026 Hackathon: Retrospective & Winning Builds',
      excerpt: '48 hours, 12 projects, 3 grand prizes. Highlights of what our summer cohorts created across AI and student utilities.',
      content: "Over the summer, over 80 students gathered for 48 hours of intense hacking and product design. From neural course scheduling to peer-to-peer code collaboration meshes, here are the snapshot highlights and victory celebrations from demo night.",
      author: 'Priya Nair (Vice President)',
      tag: 'Hackathon',
      read_time: '5 min read',
      image_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      photos: [
        'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80'
      ],
      published_at: '2026-08-28T00:00:00Z'
    },
    {
      title: 'Why We Deploy Student Projects to Cloudflare Pages',
      excerpt: 'A technical breakdown of why we transitioned our workshop curriculum to CF Pages: edge KV, zero cold starts, and generous free tiers.',
      content: 'When teaching students how to deploy their first full-stack applications, latency and simplicity matter. Here is our setup and photos from the live deployment workshop.',
      author: 'Dev Patel (Backend Lead)',
      tag: 'Infrastructure',
      read_time: '6 min read',
      image_url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
      photos: [
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1531497865144-0464ef8fb9a9?auto=format&fit=crop&w=1200&q=80'
      ],
      published_at: '2026-09-10T00:00:00Z'
    },
  ])
  if (blogErr) console.error('blogs:', blogErr.message)
  else console.log('✅ blogs seeded')

  // ── Member Voices ───────────────────────────────────────
  const { error: voicesErr } = await supabase.from('voices').upsert([
    { quote: 'Joining SDC transformed how I code. Instead of reading docs alone, I was building production microservices alongside senior devs. That hands-on speed is the only reason our squad won our first national hackathon.', name: 'Aarav Sharma', year: '3rd Year, Computer Engineering', initials: 'AS', sort_order: 1 },
    { quote: 'The WebGL and interactive graphics workshops blew my mind. Where else in college do you write raw GLSL shaders and deploy 3D canvas sites with 60 FPS performance? SDC is the sharpest tech community on campus.', name: 'Riya Patel', year: '2nd Year, Data Science', initials: 'RP', sort_order: 2 },
    { quote: 'You do not just write toy scripts here. You architect real systems with continuous integration and automated tests. The late-night build sprints and peer PR reviews gave me the exact confidence needed for top tech interviews.', name: 'Devansh Mehta', year: '4th Year, Information Technology', initials: 'DM', sort_order: 3 },
  ])
  if (voicesErr) console.error('voices:', voicesErr.message)
  else console.log('✅ voices seeded')

  // ── FAQs ────────────────────────────────────────────────
  const { error: faqErr } = await supabase.from('faqs').upsert([
    { question: 'Who is eligible to join SDC?', answer: 'Any student enrolled at Parul University, Goa! Whether you are in Computer Engineering, IT, AI & Data Science, Mechanical, or any other department, all academic branches and skill levels are welcome.', sort_order: 1 },
    { question: 'Do I need prior coding experience?', answer: 'No prior experience is necessary. We run structured beginner-friendly bootcamps and pair first-year students with experienced upperclassmen.', sort_order: 2 },
    { question: 'Are there any membership fees or hidden costs?', answer: 'Zero. Joining SDC is 100% free. All workshops, hackathon mentoring sessions, cloud infrastructure credits for club projects, and learning resources are provided free to all members.', sort_order: 3 },
    { question: 'What is the weekly time commitment?', answer: 'We run one core 2-hour technical deep-dive workshop on weekends, plus async project squad check-ins during the week.', sort_order: 4 },
    { question: 'How do project squads and hackathon teams form?', answer: 'Every semester, we host a Project Pitch Day where members pitch ideas or join existing squads. We ensure every team has a balanced mix of frontend, backend, and UI/UX members.', sort_order: 5 },
  ])
  if (faqErr) console.error('faqs:', faqErr.message)
  else console.log('✅ faqs seeded')

  // ── Announcements ───────────────────────────────────────
  const { error: annErr } = await supabase.from('announcements').upsert([
    { headline: 'Annual Hackathon Registration Open!', category: 'Hackathon', message: 'Sign up before Oct 20 to secure early bird mentor slots and free gear.', is_active: true },
    { headline: 'Scheduled Server Maintenance Notice', category: 'Urgent', message: 'The SDC build servers will be down for maintenance this Sunday 2 AM - 4 AM EST.', is_active: true },
  ])
  if (annErr) console.error('announcements:', annErr.message)
  else console.log('✅ announcements seeded')

  console.log('\n🎉 Seeding complete!')
}

seed().catch(console.error)
