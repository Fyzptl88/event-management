import { PrismaClient, Category } from "@prisma/client";

const prisma = new PrismaClient();

const now = new Date();
const addDays = (days: number, hours = 0) =>
  new Date(now.getTime() + (days * 24 + hours) * 60 * 60 * 1000);
const subDays = (days: number, hours = 0) =>
  new Date(now.getTime() - (days * 24 + hours) * 60 * 60 * 1000);

const eventsData = [
  // 10 Active + Upcoming
  {
    title: "Sunday Jazz Night",
    category: Category.MUSIC,
    city: "Coimbatore",
    startsAt: addDays(2, 4),
    price: 799,
    description:
      "An intimate evening of smooth jazz, blues, and live saxophone performances at the city cultural center.",
    imageUrl: "https://picsum.photos/seed/sunday-jazz-night/800/450",
    isActive: true,
  },
  {
    title: "Coimbatore Indie Rock Night",
    category: Category.MUSIC,
    city: "Coimbatore",
    startsAt: addDays(5, 2),
    price: 999,
    description:
      "Energetic live gig featuring top indie rock bands from south India rocking the open-air amphitheatre.",
    imageUrl: "https://picsum.photos/seed/coimbatore-indie-rock-night/800/450",
    isActive: true,
  },
  {
    title: "Coimbatore Morning Ragas",
    category: Category.MUSIC,
    city: "Coimbatore",
    startsAt: addDays(8, -2),
    price: 450,
    description:
      "A soulful early sunrise carnatic classical vocal recital by renowned maestros.",
    imageUrl: "https://picsum.photos/seed/coimbatore-morning-ragas/800/450",
    isActive: true,
  },
  {
    title: "Pottery & Clay Sculpting Workshop",
    category: Category.WORKSHOP,
    city: "Bengaluru",
    startsAt: addDays(3, 1),
    price: 1200,
    description:
      "Hands-on pottery workshop for beginners to shape ceramics on the potter's wheel and take home custom pottery.",
    imageUrl: "https://picsum.photos/seed/pottery-workshop-bengaluru/800/450",
    isActive: true,
  },
  {
    title: "Chennai Street Food Carnival",
    category: Category.FOOD,
    city: "Chennai",
    startsAt: addDays(4, 3),
    price: 250,
    description:
      "Celebrate local culinary flavours with over 40 traditional food stalls, live cooking demos, and tastings.",
    imageUrl: "https://picsum.photos/seed/chennai-street-food/800/450",
    isActive: true,
  },
  {
    title: "Kids Science & Robotics Fair",
    category: Category.KIDS,
    city: "Bengaluru",
    startsAt: addDays(6, 0),
    price: 0, // Free event (0 rupees)
    description:
      "Interactive STEM experiments, robot building challenges, and fun learning activities for children ages 6-14.",
    imageUrl: "https://picsum.photos/seed/kids-science-fair/800/450",
    isActive: true,
  },
  {
    title: "Mumbai Marathon 10K Challenge",
    category: Category.SPORTS,
    city: "Mumbai",
    startsAt: addDays(7, -1),
    price: 800,
    description:
      "Scenic coastal run across Marine Drive with hydration stations, timing chips, and finisher medals for all runners.",
    imageUrl: "https://picsum.photos/seed/mumbai-marathon-10k/800/450",
    isActive: true,
  },
  {
    title: "Mumbai VIP Tech Leadership Conclave",
    category: Category.WORKSHOP,
    city: "Mumbai",
    startsAt: addDays(10, 5),
    price: 150000, // Price >= 150000 (rupees)
    description:
      "Exclusive executive retreat and leadership symposium for senior tech directors and startup founders at a luxury resort.",
    imageUrl: "https://picsum.photos/seed/mumbai-tech-leadership/800/450",
    isActive: true,
  },
  {
    title: "Artisanal Sourdough Baking Masterclass",
    category: Category.FOOD,
    city: "Coimbatore",
    startsAt: addDays(12, 1),
    price: 2200,
    description:
      "Learn fermentation techniques, scoring, and baking rustic crusty sourdough bread with chef guidance.",
    imageUrl: "https://picsum.photos/seed/sourdough-masterclass/800/450",
    isActive: true,
  },
  {
    title: "Children Puppet Theatre & Storytelling",
    category: Category.KIDS,
    city: "Chennai",
    startsAt: addDays(14, 2),
    price: 350,
    description:
      "Colourful traditional shadow puppets bringing folklore to life with lively music and interactive audience participation.",
    imageUrl: "https://picsum.photos/seed/puppet-theatre-chennai/800/450",
    isActive: true,
  },

  // 2 Active + Past
  {
    title: "Chennai Monsoon Classical Symphony",
    category: Category.MUSIC,
    city: "Chennai",
    startsAt: subDays(5, 3),
    price: 600,
    description:
      "An orchestral fusion symphony celebrating classic south Indian melodies in the rainy season.",
    imageUrl: "https://picsum.photos/seed/chennai-monsoon-symphony/800/450",
    isActive: true,
  },
  {
    title: "Bengaluru Badminton Weekend Tournament",
    category: Category.SPORTS,
    city: "Bengaluru",
    startsAt: subDays(12, 1),
    price: 500,
    description:
      "Fast-paced amateur doubles and singles knockout tournament held at the city indoor stadium.",
    imageUrl: "https://picsum.photos/seed/bengaluru-badminton-tournament/800/450",
    isActive: true,
  },

  // 3 Inactive: 2 upcoming, 1 past
  {
    title: "Bengaluru Rooftop Electronic Music Showcase",
    category: Category.MUSIC,
    city: "Bengaluru",
    startsAt: addDays(9, 4),
    price: 1500,
    description:
      "Postponed electronic music showcase featuring synth artists and visual light projection shows.",
    imageUrl: "https://picsum.photos/seed/bengaluru-electronic-music/800/450",
    isActive: false,
  },
  {
    title: "Junior Football Coaching Clinic",
    category: Category.SPORTS,
    city: "Mumbai",
    startsAt: addDays(11, 2),
    price: 1200,
    description:
      "Grassroots football skills camp for youth players run by certified professional coaches.",
    imageUrl: "https://picsum.photos/seed/junior-football-clinic/800/450",
    isActive: false,
  },
  {
    title: "Old Town Heritage Food Walk",
    category: Category.FOOD,
    city: "Chennai",
    startsAt: subDays(8, 2),
    price: 400,
    description:
      "Historic walking tour exploring colonial bakeries and century-old sweet stalls in Georgetown.",
    imageUrl: "https://picsum.photos/seed/old-town-heritage-walk/800/450",
    isActive: false,
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear events and dependent relations first to ensure re-runnability
  await prisma.cardDesign.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.event.deleteMany();

  for (const event of eventsData) {
    await prisma.event.create({
      data: event,
    });
  }

  const count = await prisma.event.count();
  console.log(`Seeding complete. Inserted exactly ${count} events.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
