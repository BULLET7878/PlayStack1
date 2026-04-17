import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Heart, Users, ArrowRight, Play, CheckCircle, HelpCircle, ChevronRight, Gift, Calendar } from 'lucide-react';

import './styles/App.css';
import './styles/Theme.css';
import './styles/Dashboard.css';

import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import api from './services/api';

// --- Home Components ---

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="logo">
        <Link to="/">Fairway Rewards</Link>
      </div>
      <div className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
            <button onClick={logout} className="btn btn-secondary">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary glass">Member Login</Link>
            <Link to="/signup" className="btn btn-primary">Join Now</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const DrawCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 12); // Mock target to 12 days away
    
    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate - now;

      const d = Math.floor(difference / (1000 * 60 * 60 * 24));
      const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days: d, hours: h, minutes: m, seconds: s });
      
      if (difference < 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="draw-countdown-box">
      <Calendar size={24} style={{marginBottom: '0.5rem'}}/>
      <h4 style={{textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '2px'}}>Next Reward Draw</h4>
      <div className="timer-units">
        <div className="timer-unit"><span className="val">{timeLeft.days}</span><span className="label">Days</span></div>
        <div className="timer-unit"><span className="val">{timeLeft.hours}</span><span className="label">Hrs</span></div>
        <div className="timer-unit"><span className="val">{timeLeft.minutes}</span><span className="label">Min</span></div>
        <div className="timer-unit"><span className="val">{timeLeft.seconds}</span><span className="label">Sec</span></div>
      </div>
    </div>
  );
};

const MembershipPlans = () => {
  return (
    <div className="pricing-grid">
      <motion.div className="pricing-card" whileHover={{y: -10}}>
        <h4>Birdie</h4>
        <div className="price">£10<span>/mo</span></div>
        <p style={{color: '#666'}}>Perfect for casual impact.</p>
        <ul>
          <li><CheckCircle size={18} color="#28a745"/> Entry into monthly draw</li>
          <li><CheckCircle size={18} color="#28a745"/> Support 1 charity cause</li>
          <li><CheckCircle size={18} color="#28a745"/> Basic prize pool access</li>
        </ul>
        <Link to="/signup" className="btn btn-secondary">Get Started</Link>
      </motion.div>
      
      <motion.div className="pricing-card featured" whileHover={{y: -10}}>
        <div className="badge">Most Popular</div>
        <h4>Eagle</h4>
        <div className="price">£25<span>/mo</span></div>
        <p style={{color: '#666'}}>Serious player, serious impact.</p>
        <ul>
          <li><CheckCircle size={18} color="#28a745"/> 3x Entry into monthly draw</li>
          <li><CheckCircle size={18} color="#28a745"/> Support up to 3 charities</li>
          <li><CheckCircle size={18} color="#28a745"/> Exclusive "Eagle-Only" prizes</li>
        </ul>
        <Link to="/signup" className="btn btn-primary">Join Eagle Tier</Link>
      </motion.div>

      <motion.div className="pricing-card" whileHover={{y: -10}}>
        <h4>Albatross</h4>
        <div className="price">£50<span>/mo</span></div>
        <p style={{color: '#666'}}>Legendary impact partner.</p>
        <ul>
          <li><CheckCircle size={18} color="#28a745"/> 10x Entry into monthly draw</li>
          <li><CheckCircle size={18} color="#28a745"/> Multi-cause impact (5+)</li>
          <li><CheckCircle size={18} color="#28a745"/> VIP hospitality access</li>
        </ul>
        <Link to="/signup" className="btn btn-secondary">Join Albatross</Link>
      </motion.div>
    </div>
  );
};

const FAQSection = () => {
  const [active, setActive] = useState(0);
  const faqs = [
    { q: "How does the Stableford scoring work?", a: "Every point you score on the course counts. Our algorithm hashes your 5 most recent scores into a pattern-matched frequency that determines your probability in the monthly draw." },
    { q: "Where does my subscription fee go?", a: "10% of every subscription goes directly to our featured charity partners. The remainder powers the prize pool and platform operations." },
    { q: "Can I change my charity at any time?", a: "Yes! You can update your selected cause in your user dashboard and your contribution will immediately pivot to the new organization." }
  ];

  return (
    <div className="faq-container">
      {faqs.map((faq, i) => (
        <div key={i} className="faq-item" onClick={() => setActive(i === active ? -1 : i)}>
          <div className="faq-question">
            {faq.q}
            <ChevronRight style={{transform: active === i ? 'rotate(90deg)' : 'none', transition: '0.3s'}}/>
          </div>
          <AnimatePresence>
            {active === i && (
              <motion.div 
                className="faq-answer"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                {faq.a}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

const ResultsShowcase = () => {
  return (
    <div className="results-banner">
      <div className="results-info">
        <div className="status-badge active">Last Draw: April 1st</div>
        <h3 style={{fontSize: '2rem', marginBottom: '0.5rem', color: '#1e6030'}}>Last Month's Winning Numbers</h3>
        <p style={{color: '#666'}}>Congratulations to our 15,402 winners who shared £114,200!</p>
      </div>
      <div className="winning-numbers">
        <div className="number-ball">04</div>
        <div className="number-ball">12</div>
        <div className="number-ball">28</div>
        <div className="number-ball">33</div>
        <div className="number-ball gold">41</div>
      </div>
    </div>
  );
};

const LeaderboardSnippet = () => {
  const players = [
    { rank: 1, name: "David L.", score: 42, impact: "£2,400" },
    { rank: 2, name: "Sarah K.", score: 40, impact: "£1,850" },
    { rank: 3, name: "Mike R.", score: 39, impact: "£1,200" }
  ];

  return (
    <div className="leaderboard-card" style={{background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-soft)'}}>
      <h4 style={{marginBottom: '1rem', color: '#1e6030', display: 'flex', alignItems: 'center', gap: '8px'}}><Trophy size={18}/> Live Impact Leaders</h4>
      <div className="leader-list">
        {players.map((p, i) => (
          <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: i < 2 ? '1px solid #eee' : 'none'}}>
            <span style={{fontWeight: 'bold', width: '25px'}}>{p.rank}.</span>
            <span style={{flex: 1}}>{p.name}</span>
            <span style={{color: '#28a745', fontWeight: 'bold'}}>{p.score} pts</span>
            <span style={{marginLeft: '20px', fontSize: '0.8rem', opacity: 0.6}}>Raised {p.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [featuredCharities, setFeaturedCharities] = useState([]);

  useEffect(() => {
    const fetchCharities = async () => {
      try {
        const res = await api.get('/charities/featured');
        setFeaturedCharities(res.data);
      } catch (err) {
        console.error("Failed to fetch featured charities");
      }
    };
    fetchCharities();
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80; // Navbar height
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <motion.h1>Play Your Game.<br/>Change Their World.</motion.h1>
          <motion.p>The modern golf reward engine where every Stableford point counts toward legendary prizes and life-changing charity impact.</motion.p>
          <motion.div className="cta-group">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary" style={{transform: 'none'}}>Enter Scores <ArrowRight size={18} style={{marginLeft: '8px'}}/></Link>
            ) : (
              <Link to="/signup" className="btn btn-primary" style={{transform: 'none'}}>Get Started Now <ArrowRight size={18} style={{marginLeft: '8px'}}/></Link>
            )}
            <button className="btn btn-secondary glass" onClick={() => scrollToSection('how-it-works')}><Play size={18} style={{marginRight: '8px'}}/> How it Works</button>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Bar with Countdown */}
      <section className="stats-with-countdown">
        <div className="stats-container">
          <div className="stat-box"><h2>$120K+</h2><p>Prize Pool</p></div>
          <div className="stat-box"><h2>1.5K+</h2><p>Partners</p></div>
          <div className="stat-box"><h2>$450K+</h2><p>Total Impact</p></div>
        </div>
        <DrawCountdown />
      </section>

      {/* Results & Leaderboard Section */}
      <section className="page" style={{display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start'}}>
        <ResultsShowcase />
        <LeaderboardSnippet />
      </section>

      {/* How it Works Section */}
      <section className="features-section" id="how-it-works">
        <div className="section-title">
          <h2>The Fairway Flow</h2>
          <p>Three simple steps to elevate your game and your impact.</p>
        </div>
        <div className="features-grid">
          <motion.div className="feature-item" whileHover={{ y: -5 }}>
            <div className="feature-icon"><Users size={32}/></div>
            <h3>Join the Community</h3>
            <p>Subscribe and select a cause that matters to you. 10% of every subscription goes directly to impact.</p>
            <button className="btn-secondary small-btn" onClick={() => scrollToSection('pricing')} style={{marginTop: '1rem', border: 'none', background: 'none', color: '#1e6030', fontWeight: 'bold', cursor: 'pointer'}}>View Plans <ChevronRight size={14}/></button>
          </motion.div>
          <motion.div className="feature-item" whileHover={{ y: -5 }}>
            <div className="feature-icon"><Trophy size={32}/></div>
            <h3>Log Your Rounds</h3>
            <p>Enter your 5 latest Stableford scores. Our algorithm tracks your performance for the monthly draw.</p>
          </motion.div>
          <motion.div className="feature-item" whileHover={{ y: -5 }}>
            <div className="feature-icon"><Heart size={32}/></div>
            <h3>Win & Give Back</h3>
            <p>Match numbers to win cash prizes. Even if you don't win, your contribution changes lives.</p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <section className="page" id="pricing" style={{background: '#f8f9fa', borderRadius: '40px', padding: '4rem 5%'}}>
        <div className="section-title">
          <h2>Ready to Take Your Shot?</h2>
          <p>Choose a membership level that matches your passion for both golf and giving.</p>
        </div>
        <MembershipPlans />
      </section>

      {/* Featured Charities */}
      <section className="page" id="charities">
        <div className="section-title">
          <h2>Featured Causes</h2>
          <p>Meet the organizations our community is supporting this month.</p>
        </div>
        <div className="charity-grid">
          {featuredCharities.length > 0 ? featuredCharities.map((charity, i) => (
            <motion.div key={charity.id} className="charity-card" whileHover={{y: -5}} viewport={{ once: true }}>
              <div className="charity-image">
                {charity.image_url ? <img src={charity.image_url} alt={charity.name} /> : <Heart size={48} opacity={0.2}/>}
              </div>
              <div className="charity-info">
                <h4>{charity.name}</h4>
                <p>{charity.description}</p>
                <Link to="/signup" className="btn btn-secondary small-btn" style={{padding: '0.4rem 1rem', fontSize: '0.8rem'}}>Select This Cause</Link>
              </div>
            </motion.div>
          )) : (
            <p style={{textAlign: 'center', gridColumn: '1/-1', opacity: 0.5}}>Loading impact partners...</p>
          )}
        </div>
        <div style={{textAlign: 'center', marginTop: '3rem'}}>
           <Link to="/signup" className="btn btn-secondary">Explore All Causes <ChevronRight size={18}/></Link>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="page" id="faq" style={{background: '#fff', borderRadius: '40px'}}>
        <div className="section-title">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about Fairway Rewards.</p>
        </div>
        <FAQSection />
      </section>

      {/* Final CTA */}
      <section className="hero" style={{height: '60vh', backgroundAttachment: 'scroll', backgroundPosition: 'center 70%'}}>
        <div className="hero-content">
          <div className="status-badge" style={{background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)'}}>Join 15,000+ Players</div>
          <h2 style={{fontSize: '3rem', color: 'white', marginBottom: '1.5rem'}}>Start Your Impact Journey Today</h2>
          <Link to="/signup" className="btn btn-primary">Initialize Membership <ArrowRight size={18} style={{marginLeft: '8px'}}/></Link>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h5 style={{fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem'}}>FAIRWAY REWARDS</h5>
            <p style={{opacity: 0.6, fontSize: '0.9rem'}}>Transforming the game of golf into a modern engine for social impact and reward.</p>
          </div>
          <div className="footer-col">
            <h5>Program</h5>
            <ul style={{cursor: 'pointer'}}>
              <li onClick={() => scrollToSection('how-it-works')}>How it Works</li>
              <li onClick={() => scrollToSection('pricing')}>Pricing Plans</li>
              <li onClick={() => scrollToSection('charities')}>Charity Partners</li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Legal</h5>
            <ul>
              <li>Fair Play Policy</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li onClick={() => scrollToSection('faq')}>FAQ</li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Contact</h5>
            <ul>
              <li>support@fairwayrewards.com</li>
              <li>Partner Inquiries</li>
              <li><Link to="/admin" style={{color: 'rgba(255,255,255,0.3)'}}>Admin Access</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom"><p>&copy; 2026 Fairway Rewards. Play responsibly.</p></div>
      </footer>
    </div>
  );
};

// --- App Core ---

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth isLogin={true} />} />
              <Route path="/signup" element={<Auth isLogin={false} />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
