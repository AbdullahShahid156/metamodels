import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Search, ArrowRight, Zap, Shield, Globe, Cpu, Layers, BarChart3, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Animated Counter Component ─── */
const AnimatedCounter = ({ value, suffix = '', className = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(numericValue, increment * step);
      
      // Format based on original value format
      if (value.includes(',')) {
        setDisplayValue(Math.floor(current).toLocaleString());
      } else if (value.includes('.')) {
        setDisplayValue(current.toFixed(1));
      } else {
        setDisplayValue(Math.floor(current).toLocaleString());
      }

      if (step >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className={className}>
      {isInView ? displayValue : '0'}{suffix}
    </span>
  );
};

/* ─── Particle Background Component ─── */
const ParticleField = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  const initParticles = useCallback((width, height) => {
    const count = Math.min(80, Math.floor((width * height) / 15000));
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      initParticles(rect.width, rect.height);
    };

    const handleMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouse);

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const particles = particlesRef.current;

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Draw dot — gold particles
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 179, 64, ${p.opacity})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            const alpha = (1 - dist / 150) * 0.12;
            ctx.strokeStyle = `rgba(226, 179, 64, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }

        // Mouse interaction - subtle attraction
        const mx = mouseRef.current.x - p.x;
        const my = mouseRef.current.y - p.y;
        const mDist = Math.sqrt(mx * mx + my * my);
        if (mDist < 200 && mDist > 0) {
          p.vx += (mx / mDist) * 0.02;
          p.vy += (my / mDist) * 0.02;
        }

        // Dampen velocity
        p.vx *= 0.99;
        p.vy *= 0.99;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouse);
    };
  }, [initParticles]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
};

/* ─── 3D Tilt Card Wrapper ─── */
const TiltCard = ({ children, className = '' }) => {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: tilt.x, rotateY: tilt.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ─── Landing Page ─── */
export const Landing = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const { user, profile } = useAuth();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/marketplace?search=${encodeURIComponent(searchQuery)}` : '/marketplace');
  };

  const handleSellerAction = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth?mode=register');
      return;
    }
    if (profile && profile.role === 'buyer' && !profile.is_admin) {
      toast.error('You are not registered as a seller. Please upgrade your account first.');
      return;
    }
    navigate('/seller/create');
  };

  // Cinematic stagger with blur entrance
  const fadeBlurUp = (delay = 0) => ({
    initial: { opacity: 0, y: 30, filter: 'blur(8px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { 
      duration: 0.8, 
      delay, 
      ease: [0.25, 0.46, 0.45, 0.94],
      filter: { duration: 0.6, delay }
    }
  });

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.15 }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 24, filter: 'blur(4px)' },
    show: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { 
        duration: 0.6, 
        ease: [0.25, 0.46, 0.45, 0.94] 
      } 
    }
  };

  const features = [
    {
      icon: <Zap size={22} />,
      title: "Instant Deployment",
      desc: "Deploy any AI agent in seconds. Get your API key instantly and start building."
    },
    {
      icon: <Shield size={22} />,
      title: "Enterprise Security",
      desc: "End-to-end encryption, SOC 2 compliant infrastructure. Your data stays yours."
    },
    {
      icon: <Globe size={22} />,
      title: "Global Edge Network",
      desc: "Ultra-low latency with 40+ edge locations worldwide. sub-50ms response times."
    },
    {
      icon: <Layers size={22} />,
      title: "Model Marketplace",
      desc: "2,400+ models across LLM, Vision, Audio, and multi-modal categories."
    },
    {
      icon: <BarChart3 size={22} />,
      title: "Usage Analytics",
      desc: "Real-time dashboards tracking API calls, costs, and performance metrics."
    },
    {
      icon: <Sparkles size={22} />,
      title: "Auto-Scaling",
      desc: "Seamless scaling from prototype to production. Pay only for what you use."
    }
  ];

  const steps = [
    { num: "01", title: "Discover", desc: "Browse our curated marketplace of AI models and agents. Filter by task, price, and performance." },
    { num: "02", title: "Deploy", desc: "Get an API key instantly. Integrate with a single line of code in any language or framework." },
    { num: "03", title: "Scale", desc: "Go from prototype to production seamlessly. Our infrastructure handles the rest." }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* ════════════ HERO SECTION ════════════ */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background layers */}
        <div className="absolute inset-0 grid-pattern" />
        <ParticleField />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        {/* Radial fade at edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0C0F1A_80%)]" />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-22 pb-32">
          {/* Headline */}
          <motion.h1
            {...fadeBlurUp(0.15)}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-8"
          >
            <span className="text-white">Rent & Deploy</span>
            <br />
            <span className="gradient-text">AI Agents</span>
            <span className="text-white"> in Seconds</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            {...fadeBlurUp(0.3)}
            className="text-lg sm:text-xl text-[#94A3B8] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Browse, test, and integrate powerful AI agents for any task.
            From LLMs to vision models — deploy with a single API call.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div {...fadeBlurUp(0.45)} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link to="/marketplace">
              <Button className="text-base px-8 py-3.5 font-semibold group">
                Explore Agents
                <ArrowRight size={18} className="ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              className="text-base px-8 py-3.5 font-semibold"
              onClick={handleSellerAction}
            >
              List Your Agent
            </Button>
          </motion.div>

          {/* Search bar */}
          <motion.div {...fadeBlurUp(0.55)} className="max-w-2xl mx-auto">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-[#6B7280] group-focus-within:text-[#E2B340] transition-colors duration-200" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  block w-full pl-14 pr-36 py-4
                  bg-[#141828]/80 backdrop-blur-xl
                  border border-white/[0.08]
                  rounded-2xl text-base text-white
                  placeholder-[#6B7280]
                  focus:outline-none focus:border-[#E2B340]/40
                  focus:shadow-[0_0_0_4px_rgba(226,179,64,0.1),0_0_30px_rgba(226,179,64,0.08)]
                  transition-all duration-500
                "
                placeholder="Search for AI agents, models..."
              />
              <div className="absolute inset-y-2 right-2">
                <Button type="submit" className="h-full px-6 flex items-center gap-2 text-sm rounded-xl">
                  Search
                </Button>
              </div>
            </form>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-[#6B7280]">
              <span>Trending:</span>
              {['GPT-4', 'Stable Diffusion', 'Code Agent'].map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                  onClick={() => setSearchQuery(t)}
                  className="cursor-pointer hover:text-[#E2B340] transition-colors duration-200"
                >
                  {t}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0C0F1A] to-transparent" />
      </motion.section>

      {/* ════════════ TRUSTED BY / STATS ════════════ */}
      <section className="relative py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="glass-card-static rounded-3xl p-8 sm:p-10 border border-white/[0.06] relative overflow-hidden"
          >
            {/* Subtle glow behind stats */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#E2B340]/[0.04] via-transparent to-[#8B8CF8]/[0.04] pointer-events-none animate-gradient-shift" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 relative z-10">
              {[
                { value: "2,400", suffix: "+", label: "AI Models & Agents", color: "text-white" },
                { value: "18,000", suffix: "+", label: "Active Developers", color: "text-white" },
                { value: "99.9", suffix: "%", label: "API Uptime", color: "gradient-text" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className={`text-center flex flex-col justify-center py-2 ${i !== 2 ? 'md:border-r border-white/[0.06]' : ''
                    }`}
                >
                  <div className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-2 ${stat.color}`}>
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-[#94A3B8] font-bold text-xs tracking-widest uppercase mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ FEATURES GRID ════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
              Built for builders
            </h2>
            <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
              Everything you need to discover, deploy, and scale AI agents — without the infrastructure headache.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={staggerItem}>
                <TiltCard>
                  <div className="glass-card group cursor-default h-full border-shimmer">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#E2B340]/20 to-[#F59E0B]/10 border border-[#E2B340]/10 flex items-center justify-center text-[#E2B340] mb-5 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(226,179,64,0.2)] group-hover:scale-110">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-[#94A3B8] leading-relaxed">{feature.desc}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="py-28 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E2B340]/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
              Three steps. Zero friction.
            </h2>
            <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
              From discovery to production in minutes, not months.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, filter: 'blur(4px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.12 }}
              >
                <TiltCard>
                  <div className="glass-card h-full group cursor-default relative overflow-hidden border-shimmer">
                    {/* Step number watermark */}
                    <div className="absolute -top-2 -right-2 text-[100px] font-black text-white/[0.02] leading-none select-none pointer-events-none transition-all duration-700 group-hover:text-white/[0.04] group-hover:scale-110">
                      {step.num}
                    </div>

                    <div className="relative z-10">
                      <div className="text-sm font-bold gradient-text mb-4 tracking-wider">{step.num}</div>
                      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{step.title}</h3>
                      <p className="text-[#94A3B8] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ BOTTOM CTA ════════════ */}
      <section className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#E2B340]/[0.03] to-transparent pointer-events-none" />

        {/* Orbs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1], 
            opacity: [0.5, 0.8, 0.5] 
          }} 
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] bg-[#E2B340]/8 rounded-full blur-[100px] pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1], 
            opacity: [0.4, 0.7, 0.4] 
          }} 
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-[#8B8CF8]/8 rounded-full blur-[100px] pointer-events-none" 
        />

        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <motion.div
            initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6">
              Ready to build the future?
            </h2>
            <p className="text-lg text-[#94A3B8] max-w-xl mx-auto mb-10">
              Join thousands of developers deploying AI agents on MetaModels.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/marketplace">
                <Button className="text-base px-10 py-4 font-bold animate-glow-breathe">
                  Explore Marketplace
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Button 
                variant="secondary" 
                className="text-base px-10 py-4 font-bold"
                onClick={handleSellerAction}
              >
                Start Selling
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════ ADMIN PORTAL ════════════ */}
      <div className="absolute bottom-4 right-4 z-50">
        <button 
          onClick={(e) => {
            if (user) {
              e.preventDefault();
              toast.error('You are already logged in as a user. Please sign out first to log in as an Admin.');
            } else {
              navigate('/auth?mode=login');
            }
          }}
          className="p-2.5 rounded-full bg-white/[0.02] border border-white/[0.04] hover:bg-[#E2B340]/10 hover:border-[#E2B340]/30 text-[#64748b] hover:text-[#E2B340] transition-all duration-300 cursor-pointer"
          title="Admin Access"
        >
          <Shield size={16} />
        </button>
      </div>
    </motion.div>
  );
};
