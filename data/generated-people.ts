import type { RawPersonRecord } from "@/types";

const names = [
  "Ananya Rao", "Rahul Mehta", "Mira Sen", "Arjun Kapoor", "Nadia Iqbal", "Dev Malhotra", "Kavya Nair", "Rohan Das",
  "Leena Shah", "Vikram Bedi", "Tara Menon", "Kabir Sethi", "Zoya Khan", "Aman Vora", "Isha Kulkarni", "Neel Joshi",
  "Sana Mirza", "Aditya Bose", "Rhea Bansal", "Kunal Jain", "Maya Fernandes", "Siddharth Gill", "Diya Chawla", "Varun Suri",
  "Noor Anand", "Eshan Roy", "Priya Dutta", "Aarav Kohli", "Simran Ahuja", "Nikhil Reddy", "Meera Pillai", "Yash Sehgal",
  "Alina George", "Harsh Batra", "Naina Sodhi", "Dhruv Saran", "Aisha Thomas", "Rehan Paul", "Suhani Arora", "Manav Khanna",
  "Clara Bennett", "Jonas Weber", "Elena Rossi", "Marcus Chen", "Sofia Alvarez", "Liam Osei", "Amara Okafor", "Theo Martin",
  "Freya Wilson", "Kenji Mori", "Layla Haddad", "Oscar Lind", "Ines Costa", "Samira Cole", "Julian Park", "Maeve Kelly",
  "Tanvi Bhatt", "Om Prakash", "Anika Verma", "Rishi Talwar", "Palak Mistry", "Gautam Ray", "Aditi Narang", "Vivaan Luthra",
  "Charu Mathur", "Aryan Walia", "Jhanvi Patel", "Ritvik Rao", "Ananya  Rao", "Rahul Mehta", "Mira Senn", "Arjun Kapur",
];

const companies = ["Nimble Health", "Northstar Works", "Kite Robotics", "Terra Foods", "Lumen Finance", "Saffron Mobility", "Aster Learning", "OrbitArc Labs", "Copper Cloud", "Mosaic Bio", "Kindred Systems", "Signal Harbour"];
const titles = ["co-founder", "VP Sales", "product lead", "CEO", "Head Growth", "CTO", "Chief Operating Officer", "Partner", "Advisor", "Director of Product"];
const cities = ["Bengaluru", "Mumbai", "Delhi", "Gurugram", "Hyderabad", "Pune", "Singapore", "London", "Dubai", "Berlin", "New York", "Nairobi"];
const industries = ["healthcare", "enterprise software", "climate", "consumer", "fintech", "mobility", "education", "deeptech"];
const needs = ["enterprise sales", "fundraising", "hiring", "product strategy", "global expansion", "brand building", "climate partnerships", "go-to-market"];
const offers = ["enterprise sales", "fundraising", "hiring", "product strategy", "global expansion", "brand building", "climate partnerships", "go-to-market"];
const interests = ["responsible ai", "founder wellbeing", "climate action", "future of work", "community building", "design", "health equity", "deep tech"];

function variedCompany(company: string, index: number) {
  if (index % 13 === 0) return ` ${company.toUpperCase()}  `;
  if (index % 11 === 0) return `${company} Pvt. Ltd.`;
  return company;
}

export const rawDemoPeople: RawPersonRecord[] = names.map((name, index) => {
  const company = companies[index % companies.length];
  const strong = index % 4 !== 3;
  const status = index < 34 ? "applicant" : index < 58 ? "member" : index < 65 ? "alumni" : "prospect";
  const type = index % 9 === 7 ? "investor" : index % 11 === 8 ? "advisor" : index % 3 === 0 ? "founder" : "operator";
  const years = 4 + index % 13;
  const first = name.trim().split(/\s+/)[0].toLowerCase();
  const last = name.trim().split(/\s+/).slice(-1)[0].toLowerCase();
  const record: RawPersonRecord = {
    id: `person-${String(index + 1).padStart(3, "0")}`,
    name: index % 17 === 0 ? name.toUpperCase() : ` ${name} `,
    email: index % 12 === 5 ? undefined : `${first}.${last}${index + 1}@example.test`,
    phone: index % 5 === 0 ? `+91 98${String(10000000 + index * 7919).slice(-8)}` : undefined,
    linkedin: index % 7 === 4 ? undefined : index % 6 === 0 ? `linkedin.com/in/${first}-${last}-${index + 1}/?trk=demo` : `https://www.linkedin.com/in/${first}-${last}-${index + 1}`,
    company: index % 16 === 6 ? undefined : variedCompany(company, index),
    title: index % 15 === 9 ? undefined : titles[index % titles.length],
    location: cities[index % cities.length],
    industry: industries[index % industries.length],
    type,
    status: index % 14 === 0 ? status.toUpperCase() : status,
    bio: index % 10 === 6 ? undefined : `${years}+ years building ${industries[index % industries.length]} products and teams. ${index % 2 ? "Led cross-functional growth across India and Southeast Asia." : "Enjoys turning ambiguous customer problems into durable systems."}`,
    application: status === "applicant" ? strong ? `I want a small, candid peer group while navigating ${needs[index % needs.length]}. I can share practical lessons on ${offers[(index + 2) % offers.length]} and make time for monthly office hours.` : index % 8 === 3 ? "Looks interesting. Want to network." : "I am exploring what comes next and would like to meet smart people." : undefined,
    interests: `${interests[index % interests.length]}, ${interests[(index + 3) % interests.length]}`,
    lookingFor: needs[index % needs.length],
    canHelpWith: `${offers[(index + 2) % offers.length]}, ${offers[(index + 5) % offers.length]}`,
    createdAt: new Date(Date.UTC(2026, 7, 24 - (index % 20), 8 + index % 9)).toISOString(),
  };
  if (index === 12) record.email = "zoya-at-example.test";
  if (index === 18) record.linkedin = "not-a-linkedin-profile";
  if (index === 57 || index === 63) { record.email = undefined; record.linkedin = undefined; record.company = undefined; record.title = undefined; record.bio = undefined; }
  if (index === 68) { record.email = "ananya.rao1@EXAMPLE.TEST "; record.company = "Nimble Health Pvt Ltd"; }
  if (index === 69) { record.linkedin = "https://linkedin.com/in/rahul-mehta-2/?ref=duplicate"; record.company = "Northstar Works, Inc."; }
  if (index === 70) { record.company = "KITE ROBOTICS LTD"; record.title = "Product Lead"; record.location = "Delhi"; }
  if (index === 71) { record.company = "Terra Food Labs"; record.title = "CEO"; record.location = "Gurugram"; }
  return record;
});

export const DEMO_DATA_VERSION = "2026.08.1";
