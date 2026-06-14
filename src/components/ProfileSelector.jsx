import React from 'react';
import { User, ChevronDown, Search, Info } from 'lucide-react';

export default function ProfileSelector({ 
  selectedProfileId, 
  setSelectedProfileId, 
  profiles, 
  onAnalyze 
}) {
  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || profiles[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 w-full mb-6">
      {/* Select Demo Profile Card */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm lg:col-span-7 flex flex-col justify-between">
        {/* Card Title */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-blue text-white text-xs font-bold">
            1
          </div>
          <span className="font-semibold text-[15px] text-dashboard-text tracking-tight">
            Select Demo Profile
          </span>
        </div>

        {/* Dropdown & Button Flex Container */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
          {/* Dropdown Container */}
          <div className="flex-grow w-full relative">
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                <User size={18} />
              </span>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(Number(e.target.value))}
                className="w-full pl-11 pr-10 py-3 bg-white border border-dashboard-border rounded-lg text-[15px] text-dashboard-text font-medium appearance-none cursor-pointer focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-colors"
                style={{ fontFamily: '"Inter", sans-serif' }}
              >
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 text-slate-400 pointer-events-none">
                <ChevronDown size={18} />
              </span>
            </div>
            {/* Feature Vector Text */}
            <div className="text-[12px] text-slate-400 mt-2 font-normal">
              Feature Vector: {selectedProfile.featureDimensions.toLocaleString()} dimensions
            </div>
          </div>

          {/* Analyze Profile Button */}
          <button
            onClick={onAnalyze}
            className="w-full sm:w-auto px-6 py-[14px] bg-primary-blue text-white font-semibold rounded-lg text-[15px] flex items-center justify-center gap-2 hover:bg-blue-900 active:scale-[0.98] transition-all whitespace-nowrap cursor-pointer shadow-sm"
          >
            <Search size={18} className="stroke-[2.5]" />
            <span>Analyze Profile</span>
          </button>
        </div>
      </div>

      {/* About Demo Profiles Card */}
      <div className="bg-white rounded-xl border border-dashboard-border p-6 shadow-sm lg:col-span-3 flex flex-col justify-between">
        <div className="flex items-start gap-2 mb-3">
          <Info size={16} className="text-primary-blue mt-[2px] flex-shrink-0" />
          <span className="font-semibold text-[14px] text-primary-blue tracking-tight">
            About Demo Profiles
          </span>
        </div>
        <p className="text-[13px] text-slate-500 leading-relaxed font-normal">
          These are 10 pre-defined customer profiles simulating real-world scenarios. Select a profile and run analysis to see AI-generated risk assessment and explanations.
        </p>
      </div>
    </div>
  );
}
