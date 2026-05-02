/**
 * @module CivicGuideData
 * @description CivicGuide AI — 50-State + DC Civic Dataset (2026 Midterms)
 * All dates are relative to Election Day: November 3, 2026
 * Sources: vote.org, usa.gov, state Secretary of State websites
 * DISCLAIMER: Users should always verify with their local election authority.
 * @version 2.0.0
 */

const ELECTION_DAY = '2026-11-03';

const STATE_DATA = {
  AL: { name:'Alabama', abbr:'AL', regDeadlineDays:15, regUrl:'https://www.alabamavotes.gov', absenteeDeadlineDays:7, earlyVotingDays:0, idRequired:['Photo ID (AL driver\'s license, passport, etc.)'], statusUrl:'https://myinfo.alabamavotes.gov/voterview', sameDay:false, onlineReg:true, notes:'No early voting. Absentee voting requires a valid excuse.' },
  AK: { name:'Alaska', abbr:'AK', regDeadlineDays:30, regUrl:'https://voterregistration.alaska.gov', absenteeDeadlineDays:10, earlyVotingDays:15, idRequired:['ID or voter registration card','Passport','Hunting/fishing license'], statusUrl:'https://myvoterinformation.alaska.gov', sameDay:false, onlineReg:true, notes:'Uses ranked-choice voting for general elections.' },
  AZ: { name:'Arizona', abbr:'AZ', regDeadlineDays:29, regUrl:'https://azsos.gov/elections/voting-election', absenteeDeadlineDays:11, earlyVotingDays:27, idRequired:['Photo ID with name & address','2 non-photo IDs with name & address'], statusUrl:'https://my.arizona.vote/PortalList.aspx', sameDay:false, onlineReg:true, notes:'Permanent early voting list available (AEVL).' },
  AR: { name:'Arkansas', abbr:'AR', regDeadlineDays:30, regUrl:'https://www.sos.arkansas.gov/elections/voter-information', absenteeDeadlineDays:7, earlyVotingDays:15, idRequired:['Photo ID (AR driver\'s license, passport, etc.)'], statusUrl:'https://www.voterview.ar-nova.org/voterview', sameDay:false, onlineReg:false, notes:'Photo ID required at polls.' },
  CA: { name:'California', abbr:'CA', regDeadlineDays:15, regUrl:'https://registertovote.ca.gov', absenteeDeadlineDays:7, earlyVotingDays:29, idRequired:['No ID required for most voters'], statusUrl:'https://voterstatus.sos.ca.gov', sameDay:true, onlineReg:true, notes:'All voters receive mail ballots. Same-day registration available.' },
  CO: { name:'Colorado', abbr:'CO', regDeadlineDays:8, regUrl:'https://www.sos.state.co.us/voter/pages/pub/olvr/verifyNewVoter.xhtml', absenteeDeadlineDays:0, earlyVotingDays:22, idRequired:['Photo ID or non-photo ID with signature'], statusUrl:'https://www.sos.state.co.us/voter/pages/pub/olvr/findVoterReg.xhtml', sameDay:true, onlineReg:true, notes:'All-mail election state. Every voter gets a ballot by mail.' },
  CT: { name:'Connecticut', abbr:'CT', regDeadlineDays:7, regUrl:'https://voterregistration.ct.gov', absenteeDeadlineDays:7, earlyVotingDays:14, idRequired:['ID or sign affidavit'], statusUrl:'https://portaldir.ct.gov/sots/LookUp.aspx', sameDay:true, onlineReg:true, notes:'Early voting expanded in recent years.' },
  DE: { name:'Delaware', abbr:'DE', regDeadlineDays:24, regUrl:'https://ivote.de.gov', absenteeDeadlineDays:4, earlyVotingDays:10, idRequired:['Photo ID or sign affidavit'], statusUrl:'https://ivote.de.gov/VoterView', sameDay:false, onlineReg:true, notes:'Absentee voting no excuse required.' },
  FL: { name:'Florida', abbr:'FL', regDeadlineDays:29, regUrl:'https://registertovoteflorida.gov', absenteeDeadlineDays:10, earlyVotingDays:14, idRequired:['Photo ID with signature'], statusUrl:'https://registration.elections.myflorida.com/CheckVoterStatus', sameDay:false, onlineReg:true, notes:'No-excuse absentee voting. Must request ballot each election.' },
  GA: { name:'Georgia', abbr:'GA', regDeadlineDays:29, regUrl:'https://registertovote.sos.ga.gov', absenteeDeadlineDays:11, earlyVotingDays:21, idRequired:['Photo ID (free voter ID available)'], statusUrl:'https://mvp.sos.ga.gov/s/', sameDay:false, onlineReg:true, notes:'Photo ID required. Free voter ID card available from county registrar.' },
  HI: { name:'Hawaii', abbr:'HI', regDeadlineDays:0, regUrl:'https://olvr.hawaii.gov', absenteeDeadlineDays:0, earlyVotingDays:18, idRequired:['Photo ID or last 4 SSN'], statusUrl:'https://olvr.hawaii.gov', sameDay:true, onlineReg:true, notes:'All-mail election state since 2020. Same-day registration.' },
  ID: { name:'Idaho', abbr:'ID', regDeadlineDays:25, regUrl:'https://idahovotes.gov', absenteeDeadlineDays:11, earlyVotingDays:0, idRequired:['Photo ID (driver\'s license, passport, etc.)'], statusUrl:'https://elections.sos.idaho.gov/ElectonLink/ElectionLink/ViewVoterRegistration.aspx', sameDay:true, onlineReg:true, notes:'Same-day registration at polls with photo ID.' },
  IL: { name:'Illinois', abbr:'IL', regDeadlineDays:28, regUrl:'https://ova.elections.il.gov', absenteeDeadlineDays:5, earlyVotingDays:40, idRequired:['No ID required for registered voters'], statusUrl:'https://ova.elections.il.gov/RegistrationLookup.aspx', sameDay:true, onlineReg:true, notes:'Grace period registration available through Election Day.' },
  IN: { name:'Indiana', abbr:'IN', regDeadlineDays:29, regUrl:'https://indianavoters.in.gov', absenteeDeadlineDays:12, earlyVotingDays:28, idRequired:['Government-issued photo ID'], statusUrl:'https://indianavoters.in.gov', sameDay:false, onlineReg:true, notes:'Strict photo ID required. Free ID available from BMV.' },
  IA: { name:'Iowa', abbr:'IA', regDeadlineDays:15, regUrl:'https://sos.iowa.gov/elections/voterinformation/voterregistration.html', absenteeDeadlineDays:15, earlyVotingDays:29, idRequired:['Photo ID (driver\'s license, passport, voter ID card)'], statusUrl:'https://sos.iowa.gov/elections/voterreg/regtovote/search.aspx', sameDay:true, onlineReg:true, notes:'Same-day registration at polls with ID & proof of address.' },
  KS: { name:'Kansas', abbr:'KS', regDeadlineDays:21, regUrl:'https://www.kdor.ks.gov/Apps/VoterReg/Default.aspx', absenteeDeadlineDays:7, earlyVotingDays:20, idRequired:['Photo ID'], statusUrl:'https://myvoteinfo.voteks.org/voterview', sameDay:false, onlineReg:true, notes:'Photo ID required at polls.' },
  KY: { name:'Kentucky', abbr:'KY', regDeadlineDays:29, regUrl:'https://vrsws.sos.ky.gov/ovrweb', absenteeDeadlineDays:7, earlyVotingDays:3, idRequired:['Photo ID or sign affidavit'], statusUrl:'https://vrsws.sos.ky.gov/vic', sameDay:false, onlineReg:true, notes:'Limited early voting (3 days before Election Day).' },
  LA: { name:'Louisiana', abbr:'LA', regDeadlineDays:30, regUrl:'https://www.sos.la.gov/ElectionsAndVoting', absenteeDeadlineDays:10, earlyVotingDays:14, idRequired:['Photo ID with signature'], statusUrl:'https://voterportal.sos.la.gov', sameDay:false, onlineReg:true, notes:'Open primary system — all candidates on one ballot.' },
  ME: { name:'Maine', abbr:'ME', regDeadlineDays:0, regUrl:'https://www.maine.gov/sos/cec/elec/voter-info/voterguide.html', absenteeDeadlineDays:3, earlyVotingDays:30, idRequired:['No ID required (name & address confirmed)'], statusUrl:'https://www.maine.gov/sos/cec/elec/data/index.html', sameDay:true, onlineReg:true, notes:'Same-day registration. Uses ranked-choice voting for federal races.' },
  MD: { name:'Maryland', abbr:'MD', regDeadlineDays:21, regUrl:'https://voterservices.elections.maryland.gov/OnlineVoterRegistration', absenteeDeadlineDays:7, earlyVotingDays:8, idRequired:['No ID for registered voters; first-time by-mail registrants need ID'], statusUrl:'https://voterservices.elections.maryland.gov/VoterSearch', sameDay:true, onlineReg:true, notes:'Same-day registration during early voting.' },
  MA: { name:'Massachusetts', abbr:'MA', regDeadlineDays:10, regUrl:'https://www.sec.state.ma.us/OVR', absenteeDeadlineDays:4, earlyVotingDays:14, idRequired:['No ID for most voters'], statusUrl:'https://www.sec.state.ma.us/VoterRegistrationSearch/MyVoterRegStatus.aspx', sameDay:false, onlineReg:true, notes:'No-excuse mail-in voting available.' },
  MI: { name:'Michigan', abbr:'MI', regDeadlineDays:15, regUrl:'https://mvic.sos.state.mi.us/RegisterVoter', absenteeDeadlineDays:15, earlyVotingDays:9, idRequired:['Photo ID or sign affidavit'], statusUrl:'https://mvic.sos.state.mi.us', sameDay:true, onlineReg:true, notes:'Same-day registration at clerk office with proof of residency.' },
  MN: { name:'Minnesota', abbr:'MN', regDeadlineDays:21, regUrl:'https://mnvotes.sos.mn.gov/VoterRegistration/VoterRegistrationMain.aspx', absenteeDeadlineDays:1, earlyVotingDays:46, idRequired:['Photo ID or registered voter voucher'], statusUrl:'https://mnvotes.sos.mn.gov/VoterStatus.aspx', sameDay:true, onlineReg:true, notes:'Same-day registration. One of the highest voter turnout states.' },
  MS: { name:'Mississippi', abbr:'MS', regDeadlineDays:30, regUrl:'https://www.sos.ms.gov/voter-id/voter-registration', absenteeDeadlineDays:5, earlyVotingDays:0, idRequired:['Photo ID (free voter ID available)'], statusUrl:'https://www.msegov.com/sos/voter_registration/AmIRegistered', sameDay:false, onlineReg:false, notes:'No early voting. No online registration. Excuse required for absentee.' },
  MO: { name:'Missouri', abbr:'MO', regDeadlineDays:27, regUrl:'https://www.sos.mo.gov/elections/goVoteMissouri/register', absenteeDeadlineDays:7, earlyVotingDays:0, idRequired:['Photo ID (driver\'s license, passport, military ID)'], statusUrl:'https://voteroutreach.sos.mo.gov/portal/voteroutreach/search.aspx', sameDay:false, onlineReg:true, notes:'Photo ID law in effect. No early voting; absentee in-person available.' },
  MT: { name:'Montana', abbr:'MT', regDeadlineDays:30, regUrl:'https://sosmt.gov/elections/vote', absenteeDeadlineDays:0, earlyVotingDays:30, idRequired:['Photo ID or alternative IDs'], statusUrl:'https://app.mt.gov/voterinfo', sameDay:true, onlineReg:false, notes:'Same-day registration at polls. All counties may choose mail-only elections.' },
  NE: { name:'Nebraska', abbr:'NE', regDeadlineDays:18, regUrl:'https://www.nebraska.gov/apps-sos-voter-registration', absenteeDeadlineDays:7, earlyVotingDays:30, idRequired:['Photo ID'], statusUrl:'https://www.votercheck.necvr.ne.gov/voterview', sameDay:false, onlineReg:true, notes:'Splits electoral votes by congressional district.' },
  NV: { name:'Nevada', abbr:'NV', regDeadlineDays:28, regUrl:'https://www.registertovotenv.gov', absenteeDeadlineDays:0, earlyVotingDays:14, idRequired:['No ID for registered voters; first-time voters may need ID'], statusUrl:'https://www.nvsos.gov/votersearch', sameDay:true, onlineReg:true, notes:'All active voters receive mail ballots automatically.' },
  NH: { name:'New Hampshire', abbr:'NH', regDeadlineDays:0, regUrl:'https://sos.nh.gov/elections/voters/register-to-vote', absenteeDeadlineDays:0, earlyVotingDays:0, idRequired:['Photo ID (free voter ID available)'], statusUrl:'https://app.sos.nh.gov/voterinformation', sameDay:true, onlineReg:false, notes:'Same-day registration at polls. No early voting.' },
  NJ: { name:'New Jersey', abbr:'NJ', regDeadlineDays:21, regUrl:'https://voter.svrs.nj.gov/register', absenteeDeadlineDays:7, earlyVotingDays:10, idRequired:['No ID for most voters; first-time mail registrants need ID'], statusUrl:'https://voter.svrs.nj.gov/registration-check', sameDay:false, onlineReg:true, notes:'No-excuse mail-in voting available.' },
  NM: { name:'New Mexico', abbr:'NM', regDeadlineDays:28, regUrl:'https://portal.sos.state.nm.us/OVR', absenteeDeadlineDays:7, earlyVotingDays:28, idRequired:['Name, address, and signature (no photo ID)'], statusUrl:'https://voterportal.servis.sos.state.nm.us/WhereToVote.aspx', sameDay:true, onlineReg:true, notes:'Same-day registration during early voting.' },
  NY: { name:'New York', abbr:'NY', regDeadlineDays:25, regUrl:'https://voterreg.dmv.ny.gov/MotorVoter', absenteeDeadlineDays:15, earlyVotingDays:10, idRequired:['No photo ID required; provide signature'], statusUrl:'https://voterlookup.elections.ny.gov', sameDay:false, onlineReg:true, notes:'Early voting expanded statewide.' },
  NC: { name:'North Carolina', abbr:'NC', regDeadlineDays:25, regUrl:'https://www.ncsbe.gov/registering/how-register', absenteeDeadlineDays:7, earlyVotingDays:17, idRequired:['Photo ID'], statusUrl:'https://vt.ncsbe.gov/RegLkup', sameDay:true, onlineReg:false, notes:'Same-day registration during early voting only. Photo ID required.' },
  ND: { name:'North Dakota', abbr:'ND', regDeadlineDays:0, regUrl:'https://vip.sos.nd.gov', absenteeDeadlineDays:11, earlyVotingDays:15, idRequired:['Tribal ID, driver\'s license, or other valid ID with address'], statusUrl:'https://vip.sos.nd.gov/WhereToVote.aspx', sameDay:false, onlineReg:false, notes:'No voter registration required! Only state with no registration.' },
  OH: { name:'Ohio', abbr:'OH', regDeadlineDays:30, regUrl:'https://olvr.ohiosos.gov', absenteeDeadlineDays:3, earlyVotingDays:28, idRequired:['Photo ID or last 4 SSN'], statusUrl:'https://voterlookup.ohiosos.gov/voterlookup.aspx', sameDay:false, onlineReg:true, notes:'Extended early voting period. No-excuse absentee voting.' },
  OK: { name:'Oklahoma', abbr:'OK', regDeadlineDays:25, regUrl:'https://oklahoma.gov/elections/voter-registration.html', absenteeDeadlineDays:7, earlyVotingDays:3, idRequired:['Proof of identity (voter ID card, photo ID, etc.)'], statusUrl:'https://okvoterportal.okelections.us', sameDay:false, onlineReg:false, notes:'Limited early voting. Proof of identity required.' },
  OR: { name:'Oregon', abbr:'OR', regDeadlineDays:21, regUrl:'https://sos.oregon.gov/voting/Pages/registration.aspx', absenteeDeadlineDays:0, earlyVotingDays:0, idRequired:['Signature verification on ballot'], statusUrl:'https://sos.oregon.gov/voting/Pages/myvote.aspx', sameDay:false, onlineReg:true, notes:'100% vote-by-mail state since 2000. No polling places.' },
  PA: { name:'Pennsylvania', abbr:'PA', regDeadlineDays:15, regUrl:'https://www.pavoterservices.pa.gov/Pages/VoterRegistrationApplication.aspx', absenteeDeadlineDays:7, earlyVotingDays:0, idRequired:['ID for first-time voters at new polling place'], statusUrl:'https://www.pavoterservices.pa.gov/pages/voterregistrationstatus.aspx', sameDay:false, onlineReg:true, notes:'No-excuse mail-in voting. No in-person early voting.' },
  RI: { name:'Rhode Island', abbr:'RI', regDeadlineDays:30, regUrl:'https://vote.sos.ri.gov', absenteeDeadlineDays:21, earlyVotingDays:20, idRequired:['Photo ID or non-photo ID with name'], statusUrl:'https://vote.sos.ri.gov/Home/UpdateVoterRecord', sameDay:false, onlineReg:true, notes:'Photo ID law with provisional ballot option.' },
  SC: { name:'South Carolina', abbr:'SC', regDeadlineDays:30, regUrl:'https://info.scvotes.sc.gov/eng/ovr/start.aspx', absenteeDeadlineDays:11, earlyVotingDays:14, idRequired:['Photo ID (free voter registration card available)'], statusUrl:'https://info.scvotes.sc.gov/eng/voterinquiry/VoterInformationRequest.aspx', sameDay:false, onlineReg:true, notes:'Photo ID required. Free voter registration card available.' },
  SD: { name:'South Dakota', abbr:'SD', regDeadlineDays:15, regUrl:'https://sdsos.gov/elections-voting/voting/register-to-vote/default.aspx', absenteeDeadlineDays:1, earlyVotingDays:46, idRequired:['Photo ID'], statusUrl:'https://vip.sdsos.gov/VIPLogin.aspx', sameDay:false, onlineReg:false, notes:'In-person absentee voting starts 46 days before election.' },
  TN: { name:'Tennessee', abbr:'TN', regDeadlineDays:30, regUrl:'https://ovr.govote.tn.gov', absenteeDeadlineDays:7, earlyVotingDays:20, idRequired:['Government-issued photo ID'], statusUrl:'https://tnmap.tn.gov/voterlookup', sameDay:false, onlineReg:true, notes:'Strict photo ID required. Excuse needed for absentee.' },
  TX: { name:'Texas', abbr:'TX', regDeadlineDays:30, regUrl:'https://www.votetexas.gov/register-to-vote', absenteeDeadlineDays:11, earlyVotingDays:17, idRequired:['Photo ID (TX driver\'s license, election ID certificate, passport, military ID, etc.)'], statusUrl:'https://teamrv-mvp.sos.texas.gov/MVP/mvp.do', sameDay:false, onlineReg:false, notes:'No online voter registration. Photo ID required.' },
  UT: { name:'Utah', abbr:'UT', regDeadlineDays:11, regUrl:'https://secure.utah.gov/voterreg/index.html', absenteeDeadlineDays:0, earlyVotingDays:28, idRequired:['Photo ID or 2 non-photo IDs'], statusUrl:'https://votesearch.utah.gov/voter-search/search/search-by-voter/voter-info', sameDay:true, onlineReg:true, notes:'All-mail voting. Same-day registration with valid ID.' },
  VT: { name:'Vermont', abbr:'VT', regDeadlineDays:0, regUrl:'https://olvr.vermont.gov', absenteeDeadlineDays:0, earlyVotingDays:45, idRequired:['No ID required'], statusUrl:'https://mvp.vermont.gov', sameDay:true, onlineReg:true, notes:'Same-day registration. All voters mailed ballots. No ID required.' },
  VA: { name:'Virginia', abbr:'VA', regDeadlineDays:22, regUrl:'https://vote.elections.virginia.gov/VoterInformation', absenteeDeadlineDays:11, earlyVotingDays:45, idRequired:['Photo ID (free voter ID available)'], statusUrl:'https://vote.elections.virginia.gov/VoterInformation', sameDay:false, onlineReg:true, notes:'45 days of early voting. Free photo ID available.' },
  WA: { name:'Washington', abbr:'WA', regDeadlineDays:8, regUrl:'https://voter.votewa.gov', absenteeDeadlineDays:0, earlyVotingDays:18, idRequired:['Signature verification on ballot'], statusUrl:'https://voter.votewa.gov/WhereToVote.aspx', sameDay:true, onlineReg:true, notes:'All-mail election state. Same-day registration with ID.' },
  WV: { name:'West Virginia', abbr:'WV', regDeadlineDays:21, regUrl:'https://ovr.sos.wv.gov/Register', absenteeDeadlineDays:6, earlyVotingDays:13, idRequired:['Photo ID or non-photo ID'], statusUrl:'https://apps.sos.wv.gov/Elections/Voter/VoterByIDLookup', sameDay:false, onlineReg:true, notes:'No-excuse early voting available.' },
  WI: { name:'Wisconsin', abbr:'WI', regDeadlineDays:20, regUrl:'https://myvote.wi.gov/en-us/RegisterToVote', absenteeDeadlineDays:5, earlyVotingDays:14, idRequired:['Photo ID (driver\'s license, state ID, passport, etc.)'], statusUrl:'https://myvote.wi.gov/en-us/MyVoterInfo', sameDay:true, onlineReg:true, notes:'Same-day registration at polls with proof of residence.' },
  WY: { name:'Wyoming', abbr:'WY', regDeadlineDays:14, regUrl:'https://sos.wyo.gov/Elections/State/RegisteringToVote.aspx', absenteeDeadlineDays:0, earlyVotingDays:40, idRequired:['Photo ID or sign affidavit'], statusUrl:'https://sos.wyo.gov/Elections/Docs/WYCountyClerks.pdf', sameDay:true, onlineReg:false, notes:'Same-day registration at polls.' },
  DC: { name:'District of Columbia', abbr:'DC', regDeadlineDays:21, regUrl:'https://vr.dcboe.org/vr/#/login', absenteeDeadlineDays:7, earlyVotingDays:15, idRequired:['No photo ID required'], statusUrl:'https://www.dcboe.org/Voters/Register-To-Vote/Check-Voter-Registration-Status', sameDay:true, onlineReg:true, notes:'Same-day registration. No photo ID required at polls.' }
};

Object.freeze(STATE_DATA);

/* State name & abbreviation lookup map */
const STATE_LOOKUP = {};
Object.values(STATE_DATA).forEach(s => {
  STATE_LOOKUP[s.abbr.toLowerCase()] = s.abbr;
  STATE_LOOKUP[s.name.toLowerCase()] = s.abbr;
});

Object.freeze(STATE_LOOKUP);

/**
 * Fuzzy-match a user-typed state string to a state abbreviation.
 * @param {string} input - User input (e.g., "california", "CA", "new york")
 * @returns {object|null} State data object or null
 */
function getStateData(input) {
  if (!input) return null;
  const clean = input.trim().toLowerCase();

  // Direct exact lookup (e.g., "california" or "ca")
  if (STATE_LOOKUP[clean]) return STATE_DATA[STATE_LOOKUP[clean]];

  // Common English words that happen to be state abbreviations — skip these
  const COMMON_WORDS = new Set(['in', 'or', 'ok', 'hi', 'me', 'la', 'id', 'al', 'de', 'co', 'ma', 'md', 'mo', 'mt', 'ne', 'oh', 'pa', 'va']);

  // Tokenize input into individual words
  const words = clean.replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);

  // Only match abbreviations if the entire input is a single 2-letter word
  // This prevents "In-person voting" from matching "IN" (Indiana)
  if (words.length === 1 && words[0].length === 2) {
    if (STATE_LOOKUP[words[0]]) return STATE_DATA[STATE_LOOKUP[words[0]]];
  }

  // For multi-word inputs, only try matching against full state names (not abbreviations)
  // Try multi-word state names first (e.g., "new york", "north carolina")
  for (const key of Object.keys(STATE_LOOKUP)) {
    if (key.length > 2 && clean.includes(key)) {
      return STATE_DATA[STATE_LOOKUP[key]];
    }
  }

  // Try individual words against full state names only (length > 2)
  for (const word of words) {
    if (word.length > 2 && STATE_LOOKUP[word]) {
      return STATE_DATA[STATE_LOOKUP[word]];
    }
  }

  // Partial name match (only for inputs >= 4 chars to avoid false positives)
  if (clean.length >= 4) {
    for (const key of Object.keys(STATE_LOOKUP)) {
      if (key.length > 2 && key.includes(clean)) {
        return STATE_DATA[STATE_LOOKUP[key]];
      }
    }
  }

  return null;
}

/**
 * Calculate milestone dates for a given state
 * @param {object} stateData
 * @returns {object} milestones with dates
 */
function getMilestones(stateData) {
  const eDay = new Date(ELECTION_DAY + 'T00:00:00');
  const regDate = new Date(eDay);
  regDate.setDate(regDate.getDate() - stateData.regDeadlineDays);
  const absenteeDate = new Date(eDay);
  absenteeDate.setDate(absenteeDate.getDate() - stateData.absenteeDeadlineDays);
  const earlyStart = new Date(eDay);
  earlyStart.setDate(earlyStart.getDate() - stateData.earlyVotingDays);

  return {
    registration: { date: regDate, days: stateData.regDeadlineDays, label: 'Registration Deadline' },
    absentee: { date: absenteeDate, days: stateData.absenteeDeadlineDays, label: 'Ballot Request Deadline' },
    earlyVoting: { date: earlyStart, days: stateData.earlyVotingDays, label: 'Early Voting Begins' },
    electionDay: { date: eDay, days: 0, label: 'Election Day' }
  };
}
