import React, { useState } from 'react';
import { ShieldCheck, Calendar, Brain, ShieldAlert, Flag, Download } from 'lucide-react';
import BankOfIndiaLogo from './BankOfIndiaLogo';
import ProfileSelector from './ProfileSelector';
import RiskGauge from './RiskGauge';
import FeatureImportance from './FeatureImportance';
import SummaryCard from './SummaryCard';

// 10 Pre-defined Customer Profiles
const PROFILES_DATA = [
  {
    id: 1,
    name: 'High Risk Profile #1',
    featureDimensions: 3924,
    riskScore: 94,
    prediction: 'Potential Mule Account',
    confidence: 97,
    recommendedAction: 'Escalate Investigation',
    priority: 'High',
    features: [
      { name: 'F670', value: 24 },
      { name: 'F2122', value: 18 },
      { name: 'F3894', value: 15 },
      { name: 'F527', value: 10 },
      { name: 'F321', value: -5 }
    ],
    insights: [
      'High transaction velocity detected',
      'Multiple layering patterns identified',
      'Unusual beneficiary network'
    ],
    summary: 'This profile exhibits behavioral patterns similar to previously identified mule accounts. The risk score is significantly elevated due to abnormal values in multiple high-impact features including transaction velocity, fund layering indicators, and unusual network behavior.',
    recommendation: 'Escalate this profile for manual investigation and enhanced due diligence.'
  },
  {
    id: 2,
    name: 'High Risk Profile #2',
    featureDimensions: 3512,
    riskScore: 87,
    prediction: 'Potential Mule Account',
    confidence: 94,
    recommendedAction: 'Escalate Investigation',
    priority: 'High',
    features: [
      { name: 'F670', value: 22 },
      { name: 'F2122', value: 16 },
      { name: 'F3894', value: 12 },
      { name: 'F527', value: 8 },
      { name: 'F321', value: -3 }
    ],
    insights: [
      'Sudden high-volume transactions',
      'Shell company beneficiary links',
      'Rapid funds routing within minutes'
    ],
    summary: 'This profile shows indicators of rapid fund movement shortly after a period of dormancy. Multiple high-impact transaction features exceed typical threshold variances, suggesting active involvement in fund layering.',
    recommendation: 'Escalate this profile for manual investigation and enhanced due diligence.'
  },
  {
    id: 3,
    name: 'Medium Risk Profile #1',
    featureDimensions: 2840,
    riskScore: 58,
    prediction: 'Suspicious Activity',
    confidence: 81,
    recommendedAction: 'Enhanced Monitoring',
    priority: 'Medium',
    features: [
      { name: 'F670', value: 14 },
      { name: 'F2122', value: 11 },
      { name: 'F3894', value: 9 },
      { name: 'F527', value: -2 },
      { name: 'F321', value: -8 }
    ],
    insights: [
      'Above average transaction frequency',
      'Minor velocity alert triggered',
      'Out-of-state IP login detected'
    ],
    summary: 'The profile exhibits moderate variations from normal baseline behavior, particularly in transaction frequency. While not conclusively a mule account, the risk score is elevated enough to warrant enhanced monitoring.',
    recommendation: 'Place account under enhanced monitoring and perform a review if activity continues to escalate.'
  },
  {
    id: 4,
    name: 'Medium Risk Profile #2',
    featureDimensions: 3105,
    riskScore: 64,
    prediction: 'Suspicious Activity',
    confidence: 85,
    recommendedAction: 'Enhanced Monitoring',
    priority: 'Medium',
    features: [
      { name: 'F670', value: 16 },
      { name: 'F2122', value: 12 },
      { name: 'F3894', value: -4 },
      { name: 'F527', value: 11 },
      { name: 'F321', value: -6 }
    ],
    insights: [
      'Mismatched sender-receiver names',
      'High frequency of round-sum transfers',
      'Dormancy followed by sudden inflow'
    ],
    summary: 'The profile shows moderate risk indicators, primarily driven by round-sum transfers and name mismatch anomalies. This behavior warrants secondary review and temporary transaction caps.',
    recommendation: 'Apply transaction limits and initiate contact with the customer for clarification.'
  },
  {
    id: 5,
    name: 'Low Risk Profile #1',
    featureDimensions: 1240,
    riskScore: 15,
    prediction: 'Normal Account',
    confidence: 98,
    recommendedAction: 'No Action Required',
    priority: 'Low',
    features: [
      { name: 'F670', value: 3 },
      { name: 'F2122', value: -6 },
      { name: 'F3894', value: -14 },
      { name: 'F527', value: -18 },
      { name: 'F321', value: -22 }
    ],
    insights: [
      'Consistent historical patterns',
      'Low transaction velocity',
      'Established beneficiary network'
    ],
    summary: 'This account displays high consistency with established normal customer profiles. Transaction patterns, volume, and velocities are well within normal operating parameters with no layering anomalies.',
    recommendation: 'No action required. The account exhibits low risk and typical transactional behavior.'
  },
  {
    id: 6,
    name: 'Low Risk Profile #2',
    featureDimensions: 980,
    riskScore: 8,
    prediction: 'Normal Account',
    confidence: 99,
    recommendedAction: 'No Action Required',
    priority: 'Low',
    features: [
      { name: 'F670', value: 1 },
      { name: 'F2122', value: -10 },
      { name: 'F3894', value: -18 },
      { name: 'F527', value: -22 },
      { name: 'F321', value: -25 }
    ],
    insights: [
      'Salary account matching payroll cycles',
      'Predictable bill payments',
      'Single device access history'
    ],
    summary: 'This account is a highly stable personal salary account with predictable inflows and outflows. There are no signs of layering, remote control access, or suspicious third-party linkages.',
    recommendation: 'No action required. Allow normal operation.'
  },
  {
    id: 7,
    name: 'High Risk Profile #3',
    featureDimensions: 4102,
    riskScore: 91,
    prediction: 'Potential Mule Account',
    confidence: 96,
    recommendedAction: 'Escalate Investigation',
    priority: 'High',
    features: [
      { name: 'F670', value: 25 },
      { name: 'F2122', value: 17 },
      { name: 'F3894', value: 16 },
      { name: 'F527', value: 9 },
      { name: 'F321', value: -4 }
    ],
    insights: [
      'Repetitive incoming shell transfers',
      'Instant routing to off-shore nodes',
      'Multiple device changes in 24 hours'
    ],
    summary: 'This profile has extremely high risk scores, displaying pattern matches for overseas fund flight and device swapping. Rapid fund layering through remote login endpoints has been verified by the anomaly model.',
    recommendation: 'Freeze outbound transactions immediately and escalate to the Financial Intelligence Unit.'
  },
  {
    id: 8,
    name: 'Medium Risk Profile #3',
    featureDimensions: 2120,
    riskScore: 45,
    prediction: 'Suspicious Activity',
    confidence: 76,
    recommendedAction: 'Enhanced Monitoring',
    priority: 'Medium',
    features: [
      { name: 'F670', value: 10 },
      { name: 'F2122', value: 8 },
      { name: 'F3894', value: 6 },
      { name: 'F527', value: -1 },
      { name: 'F321', value: -10 }
    ],
    insights: [
      'Occasional high-value check deposits',
      'Immediate ATM cash-outs',
      'New beneficiary addition'
    ],
    summary: 'The profile exhibits mild layering traits such as fast cash-outs of check deposits. Although not categorized as a definite mule pattern, the recent beneficiary addition suggests a need for tracking.',
    recommendation: 'Monitor cash-out patterns and require additional verification for the new beneficiary.'
  },
  {
    id: 9,
    name: 'High Risk Profile #4',
    featureDimensions: 4235,
    riskScore: 96,
    prediction: 'Potential Mule Account',
    confidence: 98,
    recommendedAction: 'Escalate Investigation',
    priority: 'High',
    features: [
      { name: 'F670', value: 28 },
      { name: 'F2122', value: 20 },
      { name: 'F3894', value: 18 },
      { name: 'F527', value: 12 },
      { name: 'F321', value: -2 }
    ],
    insights: [
      'Structured micro-deposits (smurfing)',
      'Consolidated bulk outbound transfer',
      'New account with no historical basis'
    ],
    summary: 'This newly opened profile exhibits classic smurfing characteristics: multiple small inward deposits followed by a consolidated high-value transfer. This is a high-confidence mule marker.',
    recommendation: 'Lock account credentials, flag related beneficiary accounts, and report to compliance.'
  },
  {
    id: 10,
    name: 'Low Risk Profile #3',
    featureDimensions: 1560,
    riskScore: 19,
    prediction: 'Normal Account',
    confidence: 96,
    recommendedAction: 'No Action Required',
    priority: 'Low',
    features: [
      { name: 'F670', value: 5 },
      { name: 'F2122', value: -4 },
      { name: 'F3894', value: -10 },
      { name: 'F527', value: -12 },
      { name: 'F321', value: -15 }
    ],
    insights: [
      'Standard household utility payments',
      'Stable geographic transaction history',
      'Consistent mobile wallet transfers'
    ],
    summary: 'This account displays low risk scores. It has a standard history of household billing and regional transactions that line up well with low-risk consumer benchmarks.',
    recommendation: 'No action required. The account exhibits standard personal retail usage.'
  }
];

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(1);
  const [activeProfile, setActiveProfile] = useState(PROFILES_DATA[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    // Simulate short AI computation delay for interactive premium feel
    setTimeout(() => {
      const match = PROFILES_DATA.find((p) => p.id === selectedId);
      if (match) {
        setActiveProfile(match);
      }
      setIsAnalyzing(false);
    }, 600);
  };

  const handleDownloadReport = () => {
    // Elegant browser print dialogue styled for printing the report details
    window.print();
  };

  // Dynamically determine colors for confidence and actions
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-500';
      case 'Low':
      default:
        return 'text-green-600';
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-bg py-6 px-4 md:px-8 select-none print:bg-white print:p-0">
      {/* Maximum 1600px centered layout container */}
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
        
        {/* Top Horizontal Header */}
        <header className="bg-white rounded-xl border border-dashboard-border px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm print:border-none print:shadow-none print:px-0">
          {/* Logo & Title Left Block */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <BankOfIndiaLogo />
            {/* Vertical divider line */}
            <div className="hidden sm:block w-[1.5px] h-9 bg-slate-200"></div>
            {/* Header Titles */}
            <div className="flex flex-col text-center sm:text-left">
              <h1 
                className="text-[23px] font-extrabold tracking-tight"
                style={{ color: '#003B95', fontFamily: '"Outfit", sans-serif' }}
              >
                MuleShield AI
              </h1>
              <p className="text-[12px] font-medium text-slate-500 tracking-wide mt-[2px]">
                AI-Powered Mule Account Detection System
              </p>
            </div>
          </div>

          {/* Secure Badges & Date/Time Right Block */}
          <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
            {/* Security Checkmark indicator */}
            <div className="flex items-center gap-1.5 text-[12px] font-bold text-primary-blue tracking-wide">
              <ShieldCheck size={16} className="text-primary-blue stroke-[2.5]" />
              <span>Secure. Intelligent. Reliable.</span>
            </div>
            {/* Static Calendar date/time matching screenshot */}
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400">
              <Calendar size={14} className="text-slate-400" />
              <span>20 May 2025</span>
              <span className="text-slate-300">|</span>
              <span>11:30 AM</span>
            </div>
          </div>
        </header>

        {/* SECTION 1: Top Action Area */}
        <div className="print:hidden">
          <ProfileSelector
            selectedProfileId={selectedId}
            setSelectedProfileId={setSelectedId}
            profiles={PROFILES_DATA}
            onAnalyze={handleAnalyze}
          />
        </div>

        {/* Main Content Area - includes overlay during analysis */}
        <div className="relative flex flex-col gap-6">
          {/* Loading Indicator */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-dashboard-bg/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-xl">
              <div className="bg-white border border-dashboard-border shadow-md rounded-lg py-4 px-8 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-[2.5px] border-primary-blue border-t-transparent animate-spin"></div>
                <span className="text-[14px] font-semibold text-primary-blue">Analyzing customer vector...</span>
              </div>
            </div>
          )}

          {/* SECTION 2: 4 Cards in a Row */}
          <div className="grid grid-cols-1 md:grid-cols-10 gap-6 w-full">
            {/* CARD 1: Risk Score (spans 4/10 columns) */}
            <div className="md:col-span-4 h-[240px]">
              <RiskGauge score={activeProfile.riskScore} />
            </div>

            {/* CARD 2: Prediction (spans 2/10 columns) */}
            <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm md:col-span-2 flex flex-col justify-between h-[240px]">
              <div>
                <span className="font-bold text-[12px] text-slate-400 tracking-wider">
                  PREDICTION
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 flex-grow">
                <h3 
                  className="text-[24px] font-extrabold leading-[1.2] tracking-tight"
                  style={{ color: '#003B95', fontFamily: '"Outfit", sans-serif' }}
                >
                  {activeProfile.prediction}
                </h3>
                {/* Brain Icon in light blue circle */}
                <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 self-start shadow-sm">
                  <Brain className="text-primary-blue w-5 h-5 stroke-[2]" />
                </div>
              </div>
            </div>

            {/* CARD 3: Confidence (spans 2/10 columns) */}
            <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm md:col-span-2 flex flex-col justify-between h-[240px]">
              <div>
                <span className="font-bold text-[12px] text-slate-400 tracking-wider">
                  CONFIDENCE
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 flex-grow">
                <div className="flex flex-col justify-end h-full pb-2">
                  <span 
                    className="text-[38px] font-extrabold text-green-500 leading-none"
                    style={{ fontFamily: '"Outfit", sans-serif' }}
                  >
                    {activeProfile.confidence}%
                  </span>
                  <span className="text-[12px] text-slate-400 font-semibold mt-2">
                    Model Confidence
                  </span>
                </div>
                {/* Green Shield Check Icon in light green circle */}
                <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0 self-start shadow-sm">
                  <ShieldCheck className="text-green-500 w-5 h-5 stroke-[2]" />
                </div>
              </div>
            </div>

            {/* CARD 4: Recommended Action (spans 2/10 columns) */}
            <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm md:col-span-2 flex flex-col justify-between h-[240px]">
              <div>
                <span className="font-bold text-[12px] text-slate-400 tracking-wider">
                  RECOMMENDED ACTION
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 flex-grow">
                <div className="flex flex-col justify-end h-full pb-2">
                  <span 
                    className="text-[20px] font-extrabold text-red-500 leading-[1.2] tracking-tight"
                    style={{ fontFamily: '"Outfit", sans-serif' }}
                  >
                    {activeProfile.recommendedAction}
                  </span>
                  <span className="text-[12px] text-slate-400 font-semibold mt-2">
                    Priority: <span className={`font-bold ${getPriorityColor(activeProfile.priority)}`}>{activeProfile.priority}</span>
                  </span>
                </div>
                {/* Red Flag Icon in light red circle */}
                <div className="w-11 h-11 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 self-start shadow-sm">
                  <Flag className="text-red-500 w-5 h-5 stroke-[2]" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Two Large Cards (1/2 split) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Left Card: Feature Importance */}
            <div className="min-h-[300px]">
              <FeatureImportance features={activeProfile.features} />
            </div>

            {/* Right Card: Summary Card */}
            <div className="min-h-[300px]">
              <SummaryCard 
                summaryText={activeProfile.summary}
                insights={activeProfile.insights}
                recommendation={activeProfile.recommendation}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Download Button */}
        <div className="flex justify-center mt-2 mb-6 print:hidden">
          <button
            onClick={handleDownloadReport}
            className="px-6 py-3 border-[2px] border-primary-blue bg-white text-primary-blue font-bold rounded-lg text-[14px] flex items-center gap-2 hover:bg-primary-blue/5 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            style={{ fontFamily: '"Outfit", sans-serif' }}
          >
            <Download size={16} className="stroke-[2.5]" />
            <span>Download Investigation Report (PDF)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
