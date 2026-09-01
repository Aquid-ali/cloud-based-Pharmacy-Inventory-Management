import {
  FiHeart, FiThermometer, FiSun, FiActivity, FiShield, FiDroplet,
  FiUser, FiSmile, FiUsers, FiWind, FiPackage, FiSearch, FiCheckCircle,
  FiLock, FiBookOpen, FiTruck,
} from 'react-icons/fi';
import { TbVaccine } from 'react-icons/tb';

// Curated categories, not a database table (the medicine catalog doesn't
// carry therapeutic categories - see composition/uses instead). Each one
// links to a real search against the existing medicine-catalog search API
// (matches on name/composition/uses), so clicking through surfaces genuine
// results rather than a fake category page.
export const CATEGORIES = [
  { name: 'Pain Relief', query: 'pain relief', icon: FiActivity },
  { name: 'Cold & Cough', query: 'cold cough', icon: FiThermometer },
  { name: 'Vitamins & Supplements', query: 'vitamin', icon: FiSun },
  { name: 'Diabetes Care', query: 'diabetes', icon: FiDroplet },
  { name: 'Digestive Health', query: 'digestive', icon: TbVaccine },
  { name: 'Skin Care', query: 'skin', icon: FiSmile },
  { name: 'Heart Care', query: 'heart', icon: FiHeart },
  { name: 'Personal Care', query: 'personal care', icon: FiUser },
  { name: "Women's Health", query: 'women health', icon: FiUsers },
  { name: "Men's Health", query: 'men health', icon: FiUsers },
  { name: 'First Aid', query: 'first aid', icon: FiShield },
  { name: 'Respiratory Care', query: 'asthma respiratory', icon: FiWind },
];

export const FEATURES = [
  {
    title: 'Easy Medicine Search',
    description: 'Find medicines quickly by name, composition, or the condition they treat.',
    icon: FiSearch,
  },
  {
    title: 'Detailed Medicine Information',
    description: 'Composition, uses, side effects, and precautions in one clear place.',
    icon: FiBookOpen,
  },
  {
    title: 'Real Pharmacy Availability',
    description: 'See which pharmacies actually have a medicine in stock, and at what price.',
    icon: FiTruck,
  },
  {
    title: 'Secure Accounts',
    description: 'Your account and order history are protected with secure, encrypted authentication.',
    icon: FiLock,
  },
  {
    title: 'Organized Catalog',
    description: 'A structured, searchable medicine catalog rather than a scattered product list.',
    icon: FiPackage,
  },
  {
    title: 'Healthcare Guidance',
    description: 'General wellness information to help you stay informed about everyday health.',
    icon: FiCheckCircle,
  },
];

export const HEALTHCARE_TIPS = [
  {
    title: 'Stay Hydrated',
    description: 'Adequate water intake supports digestion, circulation, and overall energy throughout the day.',
    details: 'Needs vary by climate and activity level, so there is no single number that fits everyone. A simple habit is to keep water within reach and drink regularly through the day rather than only when very thirsty.',
  },
  {
    title: 'Healthy Eating',
    description: 'A balanced diet with fruits, vegetables, and whole grains is a foundation of good health.',
    details: 'Aim for variety across food groups rather than restrictive habits. Small, consistent choices - like adding a vegetable to a meal or choosing whole grains - add up over time.',
  },
  {
    title: 'Take Medicines Responsibly',
    description: 'Always follow the dosage and duration instructed by your doctor or pharmacist.',
    details: 'Avoid stopping a course early even if symptoms improve, and never share prescription medicines with someone else. If you are unsure about an interaction or side effect, ask a pharmacist or doctor rather than guessing.',
  },
  {
    title: 'Seasonal Health',
    description: 'Simple precautions - hygiene, warm clothing, timely rest - help you stay well through the seasons.',
    details: 'Frequent hand-washing, staying warm during cold snaps, and keeping up with rest during high-transmission seasons (like monsoon or winter) can meaningfully lower everyday illness risk.',
  },
  {
    title: 'Daily Wellness',
    description: 'Regular sleep, light activity, and short breaks from screens support long-term wellbeing.',
    details: 'Consistency tends to matter more than intensity - a short daily walk and a steady sleep schedule are more sustainable than occasional intense effort.',
  },
];

// Demo/illustrative testimonials - clearly not claimed as verified customer
// accounts (see the "Demo testimonials" label on the section itself).
export const TESTIMONIALS = [
  {
    name: 'Rahul',
    quote: 'Finding the medicine I needed was quick and straightforward. The search experience is very convenient.',
  },
  {
    name: 'Priya',
    quote: 'I liked how easy it was to browse different healthcare categories and compare pharmacies.',
  },
  {
    name: 'Arjun',
    quote: 'The website is simple to navigate and the medicine information is genuinely useful.',
  },
];

export const TRUST_STATEMENTS = [
  'Easy to Navigate',
  'Secure Authentication',
  'Organized Medicine Catalog',
  'Real Pharmacy Stock Data',
];

export const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', to: '/#about' },
    { label: 'Contact Us', to: '/contact' },
  ],
  Medicines: [
    { label: 'All Medicines', to: '/customer/medicines' },
    { label: 'Categories', to: '/#categories' },
  ],
  Healthcare: [
    { label: 'Healthcare Tips', to: '/#healthcare-tips' },
    { label: 'FAQs', to: '/faqs' },
  ],
  Customer: [
    { label: 'Login', to: '/login' },
    { label: 'Register', to: '/register' },
    { label: 'My Orders', to: '/shop/orders' },
  ],
  Support: [
    { label: 'Contact Us', to: '/contact' },
    { label: 'Help Center', to: '/faqs' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms & Conditions', to: '/terms' },
  ],
};
