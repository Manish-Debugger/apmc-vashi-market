import React from 'react';
import { 
  Building2, 
  MapPin, 
  Clock, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Layers, 
  Sprout, 
  Users, 
  Award, 
  Scale, 
  HelpCircle 
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const yards = [
    {
      name: 'Onion & Potato Market Yard (कांदा-बटाटा मार्केट)',
      location: 'Sector 18 & 19, Vashi',
      timing: '04:00 AM – 12:00 PM',
      description: 'One of Western India\'s highest volume onion and potato clearing terminals. Receives hundreds of trucks daily from Nashik, Lasalgaon, Junnar, and Ahmednagar.',
      icon: '🧅',
    },
    {
      name: 'Vegetable Market Yard (भाजीपाला मार्केट)',
      location: 'Sector 19, Vashi',
      timing: '03:30 AM – 11:30 AM',
      description: 'Clears leafy, green, and exotic vegetables sourced from Western Maharashtra, Karnataka, and Gujarat to feed the Mumbai Metropolitan Region.',
      icon: '🥦',
    },
    {
      name: 'Fruit Market Yard (फळ मार्केट)',
      location: 'Sector 19, Vashi',
      timing: '05:00 AM – 01:00 PM',
      description: 'Wholesale terminal for domestic and international fruits, including famous Ratnagiri/Devgad Alphonso Mango auctions, Shimla apples, and Jalgaon bananas.',
      icon: '🍎',
    },
    {
      name: 'Grain, Rice & Oilseeds Yard (धान्य व तेलबिया मार्केट)',
      location: 'Sector 19, Vashi',
      timing: '09:00 AM – 05:00 PM',
      description: 'Large enclosed warehouses facilitating physical wholesale auctions and transactions of food grains, pulses, wheat, basmati rice, and edible oils.',
      icon: '🌾',
    },
    {
      name: 'Spice Market Yard (मसाले मार्केट)',
      location: 'Sector 19, Vashi',
      timing: '10:00 AM – 06:00 PM',
      description: 'Renowned spice exchange trading dried red chillies, turmeric, pepper, cardamom, and specialty spices from across South and Western India.',
      icon: '🌶️',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg">
        <div className="flex items-center gap-2 text-emerald-300 text-xs uppercase tracking-wider font-semibold mb-2">
          <Building2 className="w-4 h-4" />
          <span>Asia's Premier Agricultural Terminal</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans">
          About Navi Mumbai APMC, Vashi
        </h1>
        <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-3xl">
          The Agricultural Produce Market Committee (APMC) at Vashi, Navi Mumbai, is the commercial agricultural lifeline of the Mumbai Metropolitan Region (MMR), connecting millions of farmers across India with wholesale buyers, retailers, and exporters.
        </p>
      </div>

      {/* Project Mission & Objective */}
      <div className="agri-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sprout className="w-5 h-5 text-emerald-600" />
          <span>Project Mission & Technical Objectives</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          The <strong>APMC Crop Price Information and Trend Analysis System</strong> was developed to address critical information asymmetry in agricultural markets. While official market boards publish daily notices, farmers and traders often lack a modern, responsive, and mobile-friendly tool to visualize long-term price fluctuations, compare multiple crops with standardized units, and estimate their actual take-home earnings after deducting logistics and mandi costs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs mb-1">1. Transparent Pricing</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Eliminating guesswork by reporting minimum, modal, and maximum cleared auction rates.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs mb-1">2. Trend Intelligence</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Equipping farmers with historical 7, 30, and 90-day time-series to plan crop dispatch timings.
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-xs mb-1">3. Net Revenue Realization</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Accounting for real-world costs: vehicle freight, APMC statutory cess, hamali, and packaging.
            </p>
          </div>
        </div>
      </div>

      {/* The 5 Dedicated Market Yards of Vashi */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>The Five Distinct Wholesale Market Yards at Vashi</span>
          </h2>
          <p className="text-xs text-slate-500">
            Spanning over 300 acres in Sector 18 and 19 of Vashi, Navi Mumbai, the APMC campus is divided into specialized yards
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {yards.map((yard, idx) => (
            <div key={idx} className="agri-card p-5 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{yard.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{yard.name}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-emerald-600" />
                      <span>{yard.location}</span>
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {yard.description}
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                <Clock className="w-3.5 h-3.5" />
                <span>Operating Hours: {yard.timing}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Official Data Sources & Verification Protocol */}
      <div className="agri-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Official Data Sources & Transparency Protocol</span>
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          The system prioritizes verified market transaction records from authorized agricultural reporting bodies:
        </p>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-900">AGMARKNET (agmarknet.gov.in)</h4>
              <p className="text-slate-500 text-[11px]">
                Directorate of Marketing and Inspection (DMI), Ministry of Agriculture & Farmers Welfare, Government of India.
              </p>
            </div>
            <a 
              href="https://agmarknet.gov.in" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0 hover:underline"
            >
              <span>Visit Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-bold text-slate-900">Maharashtra State Agricultural Marketing Board (MSAMB)</h4>
              <p className="text-slate-500 text-[11px]">
                Statutory board overseeing and regulating APMC wholesale transactions and bulletins across Maharashtra.
              </p>
            </div>
            <a 
              href="https://www.msamb.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0 hover:underline"
            >
              <span>Visit MSAMB</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Statutory Disclaimer */}
      <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
          <HelpCircle className="w-4 h-4 text-amber-600" />
          <span>Statutory Disclaimer & Fair Use Notice</span>
        </div>
        <p className="leading-relaxed text-[11px] text-amber-800/90">
          The price data, charts, statistical indicators, and revenue calculators provided in this platform are compiled for research, educational, and decision-support purposes only. Actual spot wholesale auction prices on any given morning in Navi Mumbai APMC Vashi vary depending on lot moisture, grading, quality classification, transport delays, and open auction demand. Farmers and traders are strongly advised to confirm with registered commission agents (Adatyas) or the market superintendent before dispatching physical consignments.
        </p>
      </div>
    </div>
  );
};
