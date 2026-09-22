import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 12);
  const adminHash = await bcrypt.hash("admin1234", 12);

  await prisma.pricingConfig.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const plans = [
    { name: "Free", tier: "free" as const, priceMonthly: 0, features: "Browse & 1 campaign", maxCampaigns: 1 },
    { name: "Starter", tier: "starter" as const, priceMonthly: 4999, features: "5 campaigns, wishlist alerts", maxCampaigns: 5 },
    { name: "Professional", tier: "professional" as const, priceMonthly: 14999, features: "Unlimited campaigns, priority support", maxCampaigns: 100 },
    { name: "Enterprise", tier: "enterprise" as const, priceMonthly: 49999, features: "Custom SLA, dedicated manager", maxCampaigns: 1000 },
  ];

  for (const plan of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { tier: plan.tier },
    });
    if (!existing) {
      await prisma.subscriptionPlan.create({ data: plan });
    }
  }

  const adminEmail = "admin@tabellone.com";
  if (!await prisma.user.findUnique({ where: { email: adminEmail } })) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: adminHash,
        role: "admin",
      },
    });
    console.log("Admin created: admin@tabellone.com / admin1234");
  }

  const ownerEmail = "owner@demo.tabellone.com";
  let ownerOrg = await prisma.organization.findFirst({
    where: { email: "contact@mumbaiprime.com" },
  });

  if (!await prisma.user.findUnique({ where: { email: ownerEmail } })) {
    ownerOrg = await prisma.organization.create({
      data: {
        name: "Mumbai Prime Billboards",
        brandName: "Mumbai Prime",
        email: "contact@mumbaiprime.com",
        sector: "Outdoor Advertising",
        contactPerson: "Rajesh Kumar",
        contactPhone: "+91 98765 43210",
        branchLocation: "Andheri, Mumbai",
        type: "owner",
      },
    });

    const user = await prisma.user.create({
      data: {
        email: ownerEmail,
        passwordHash,
        role: "owner",
        organizationId: ownerOrg.id,
      },
    });

    await prisma.ownerProfile.create({
      data: {
        userId: user.id,
        organizationId: ownerOrg.id,
        verificationStatus: "approved",
        agencyName: "Mumbai Prime Media",
      },
    });

    await prisma.wallet.create({ data: { organizationId: ownerOrg.id } });

    const adSpace1 = await prisma.adSpace.create({
      data: {
        organizationId: ownerOrg.id,
        adSpaceNumber: "AS-MUM-001",
        name: "Western Express Highway Billboard",
        adSpaceType: "billboard",
        city: "Mumbai",
        state: "Maharashtra",
        address: "WEH, Andheri East",
        dimensions: "40x20 ft",
        basePrice: 85000,
        footfall: 120000,
        peakHours: "8–10 AM, 6–9 PM",
        imdStatus: "active",
        marketplaceListingStatus: "listed",
      },
    });

    const adSpace2 = await prisma.adSpace.create({
      data: {
        organizationId: ownerOrg.id,
        adSpaceNumber: "AS-MUM-002",
        name: "Bandra Mall Digital Screen",
        adSpaceType: "digital",
        city: "Mumbai",
        state: "Maharashtra",
        dimensions: "16x9 ft LED",
        basePrice: 120000,
        footfall: 45000,
        imdStatus: "active",
        marketplaceListingStatus: "listed",
      },
    });

    await prisma.marketplaceListing.create({
      data: {
        adSpaceId: adSpace1.id,
        status: "approved",
        title: adSpace1.name,
        description: "Premium highway billboard with exceptional visibility on WEH.",
        submittedAt: new Date(),
        reviewedAt: new Date(),
      },
    });

    await prisma.marketplaceListing.create({
      data: {
        adSpaceId: adSpace2.id,
        status: "approved",
        title: adSpace2.name,
        description: "High-traffic mall digital LED screen in Bandra.",
        submittedAt: new Date(),
        reviewedAt: new Date(),
      },
    });

    const client1 = await prisma.client.create({
      data: {
        organizationId: ownerOrg.id,
        name: "Priya Sharma",
        businessName: "Fresh Foods India",
        email: "priya@freshfoods.in",
        contactPhone: "+91 99887 76655",
      },
    });

    const client2 = await prisma.client.create({
      data: {
        organizationId: ownerOrg.id,
        name: "Amit Verma",
        businessName: "AutoDrive Motors",
        email: "amit@autodrive.in",
      },
    });

    const start1 = new Date();
    start1.setDate(1);
    const end1 = new Date();
    end1.setMonth(end1.getMonth() + 1);

    await prisma.booking.create({
      data: {
        organizationId: ownerOrg.id,
        adSpaceId: adSpace1.id,
        clientId: client1.id,
        startDate: start1,
        endDate: end1,
        status: "active",
        amount: 85000,
        campaignReference: "Fresh Foods Q3",
      },
    });

    console.log("Owner demo: owner@demo.tabellone.com / demo1234");
  } else if (ownerOrg) {
    const spaces = await prisma.adSpace.findMany({
      where: { organizationId: ownerOrg.id },
    });
    for (const space of spaces) {
      if (!space.basePrice) continue;
      await prisma.adSpace.update({
        where: { id: space.id },
        data: { marketplaceListingStatus: "listed" },
      });
      await prisma.marketplaceListing.upsert({
        where: { adSpaceId: space.id },
        create: {
          adSpaceId: space.id,
          status: "approved",
          title: space.name,
          description: `Listed ${space.name} on Tabellone marketplace.`,
          submittedAt: new Date(),
          reviewedAt: new Date(),
        },
        update: { status: "approved" },
      });
    }
  }

  const advEmail = "advertiser@demo.tabellone.com";
  if (!await prisma.user.findUnique({ where: { email: advEmail } })) {
    const freePlan = await prisma.subscriptionPlan.findFirst({
      where: { tier: "free" },
    });

    const advOrg = await prisma.organization.create({
      data: {
        name: "Fresh Foods India",
        brandName: "Fresh Foods",
        email: "hello@freshfoods.in",
        sector: "FMCG",
        contactPerson: "Priya Sharma",
        type: "advertiser",
      },
    });

    const advUser = await prisma.user.create({
      data: {
        email: advEmail,
        passwordHash,
        role: "advertiser",
        organizationId: advOrg.id,
      },
    });

    await prisma.advertiserProfile.create({
      data: {
        userId: advUser.id,
        organizationId: advOrg.id,
        verificationStatus: "approved",
        gstNumber: "27AAAAA0000A1Z5",
      },
    });

    await prisma.wallet.create({
      data: { organizationId: advOrg.id, balance: 50000 },
    });

    if (freePlan) {
      const expires = new Date();
      expires.setFullYear(expires.getFullYear() + 1);
      await prisma.subscription.create({
        data: {
          organizationId: advOrg.id,
          planId: freePlan.id,
          status: "active",
          startsAt: new Date(),
          expiresAt: expires,
        },
      });
    }

    await prisma.campaign.create({
      data: {
        organizationId: advOrg.id,
        name: "Monsoon Fresh Campaign",
        productService: "Packaged foods",
        sector: "FMCG",
        targetLocation: "Mumbai",
        budget: 200000,
        preferredSize: "40x20 ft",
        expectedFootfall: 100000,
      },
    });

    console.log("Advertiser demo: advertiser@demo.tabellone.com / demo1234");
  }

  if (ownerOrg) {
    await seedSampleAdSpaces(ownerOrg.id);
  }

  console.log("Seed complete.");
}

type SampleSpace = {
  adSpaceNumber: string;
  name: string;
  adSpaceType: string;
  city: string;
  state: string;
  address: string;
  dimensions: string;
  basePrice: number;
  footfall: number;
  peakHours: string;
  photoUrl: string;
  latitude: number;
  longitude: number;
  description: string;
};

async function ensureOwnerOrg(data: {
  name: string;
  brandName: string;
  email: string;
  branchLocation: string;
}) {
  const existing = await prisma.organization.findFirst({
    where: { email: data.email },
  });
  if (existing) {
    return prisma.organization.update({
      where: { id: existing.id },
      data: {
        name: data.name,
        brandName: data.brandName,
        branchLocation: data.branchLocation,
      },
    });
  }
  const org = await prisma.organization.create({
    data: {
      name: data.name,
      brandName: data.brandName,
      email: data.email,
      sector: "Outdoor Advertising",
      branchLocation: data.branchLocation,
      type: "owner",
    },
  });
  await prisma.wallet.create({ data: { organizationId: org.id } });
  return org;
}

async function seedSampleAdSpaces(mumbaiOrgId: string) {
  const availableFrom = new Date("2026-09-01T00:00:00");
  const availableTo = new Date("2027-03-31T23:59:59");

  const [hubliOrg, bangaloreOrg, hyderabadOrg, delhiOrg, chennaiOrg, puneOrg] =
    await Promise.all([
      ensureOwnerOrg({
        name: "Hubli Prime Outdoor",
        brandName: "Hubli Prime",
        email: "contact@hubli-prime.com",
        branchLocation: "Gokul Road, Hubli",
      }),
      ensureOwnerOrg({
        name: "Bengaluru Outdoor Media",
        brandName: "Bengaluru Outdoor",
        email: "contact@blr-outdoor.com",
        branchLocation: "MG Road, Bangalore",
      }),
      ensureOwnerOrg({
        name: "Hyderabad Display Network",
        brandName: "Hyderabad Displays",
        email: "contact@hyd-displays.com",
        branchLocation: "HITEC City, Hyderabad",
      }),
      ensureOwnerOrg({
        name: "Delhi Heritage Media",
        brandName: "Delhi Heritage",
        email: "contact@delhi-heritage.com",
        branchLocation: "Connaught Place, New Delhi",
      }),
      ensureOwnerOrg({
        name: "Chennai Corridor Ads",
        brandName: "Chennai Corridor",
        email: "contact@chennai-corridor.com",
        branchLocation: "OMR, Chennai",
      }),
      ensureOwnerOrg({
        name: "Pune Mall Media",
        brandName: "Pune Mall Media",
        email: "contact@pune-mall-media.com",
        branchLocation: "Viman Nagar, Pune",
      }),
    ]);

  const orgByCity: Record<string, string> = {
    Mumbai: mumbaiOrgId,
    Hubli: hubliOrg.id,
    Bangalore: bangaloreOrg.id,
    Hyderabad: hyderabadOrg.id,
    "New Delhi": delhiOrg.id,
    Chennai: chennaiOrg.id,
    Pune: puneOrg.id,
  };

  const listingExtras: Record<
    string,
    { rating: number; availableTo?: Date }
  > = {
    "AS-MUM-001": { rating: 4.8 },
    "AS-MUM-002": { rating: 4.5 },
    "AS-DEL-001": { rating: 4.6 },
    "AS-BLR-001": {
      rating: 4.7,
      availableTo: new Date("2026-10-15T23:59:59"),
    },
    "AS-PUN-001": { rating: 3.6 },
    "AS-MUM-003": { rating: 4.3 },
    "AS-CHE-001": { rating: 4.4 },
    "AS-HYD-001": { rating: 4.5 },
    "AS-DEL-002": { rating: 4.2 },
    "AS-MUM-004": { rating: 3.5 },
    "AS-BLR-002": { rating: 4.9 },
    "AS-HYD-002": { rating: 3.8 },
    "AS-HBL-001": { rating: 4.4 },
    "AS-HBL-002": { rating: 3.9 },
    "AS-HBL-003": {
      rating: 3.4,
      availableTo: new Date("2026-12-01T23:59:59"),
    },
    "AS-HBL-004": { rating: 4.6 },
  };

  const samples: SampleSpace[] = [
    {
      adSpaceNumber: "AS-MUM-001",
      name: "Western Express Highway Billboard",
      adSpaceType: "billboard",
      city: "Mumbai",
      state: "Maharashtra",
      address: "WEH, Andheri East",
      dimensions: "40x20 ft",
      basePrice: 85000,
      footfall: 120000,
      peakHours: "8–10 AM, 6–9 PM",
      photoUrl: "/ad-spaces/as-weh-billboard.png",
      latitude: 19.1197,
      longitude: 72.8468,
      description: "Premium highway billboard with exceptional visibility on WEH.",
    },
    {
      adSpaceNumber: "AS-MUM-002",
      name: "Bandra Mall Digital Screen",
      adSpaceType: "digital",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Linking Road, Bandra West",
      dimensions: "16x9 ft LED",
      basePrice: 120000,
      footfall: 45000,
      peakHours: "12–3 PM, 6–9 PM",
      photoUrl: "/ad-spaces/as-mall-led.png",
      latitude: 19.0596,
      longitude: 72.8295,
      description: "High-traffic mall digital LED screen in Bandra.",
    },
    {
      adSpaceNumber: "AS-DEL-001",
      name: "Connaught Place Heritage Billboard",
      adSpaceType: "billboard",
      city: "New Delhi",
      state: "Delhi",
      address: "Outer Circle, Connaught Place",
      dimensions: "40x20 ft",
      basePrice: 95000,
      footfall: 150000,
      peakHours: "9–11 AM, 5–8 PM",
      photoUrl: "/ad-spaces/as-delhi-billboard.png",
      latitude: 28.6304,
      longitude: 77.2177,
      description: "Iconic CP billboard facing peak Central Delhi traffic.",
    },
    {
      adSpaceNumber: "AS-BLR-001",
      name: "MG Road Metro Digital Screen",
      adSpaceType: "digital",
      city: "Bangalore",
      state: "Karnataka",
      address: "MG Road Metro concourse",
      dimensions: "16x9 ft",
      basePrice: 72000,
      footfall: 80000,
      peakHours: "8–10 AM, 6–8 PM",
      photoUrl: "/ad-spaces/as-bangalore-metro.png",
      latitude: 12.9756,
      longitude: 77.6066,
      description: "Catch commuters on the busiest Namma Metro interchange.",
    },
    {
      adSpaceNumber: "AS-PUN-001",
      name: "Phoenix Mall Atrium Banner",
      adSpaceType: "mall",
      city: "Pune",
      state: "Maharashtra",
      address: "Viman Nagar, Phoenix Marketcity",
      dimensions: "20x10 ft",
      basePrice: 55000,
      footfall: 38000,
      peakHours: "2–6 PM, 7–9 PM",
      photoUrl: "/ad-spaces/as-pune-mall.png",
      latitude: 18.5626,
      longitude: 73.9167,
      description: "Atrium hanging banner above the central mall court.",
    },
    {
      adSpaceNumber: "AS-MUM-003",
      name: "BEST Bus Full Wrap — Route 56",
      adSpaceType: "vehicle",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Colaba to Andheri corridor",
      dimensions: "30x10 ft",
      basePrice: 48000,
      footfall: 25000,
      peakHours: "7–11 AM, 5–9 PM",
      photoUrl: "/ad-spaces/as-mumbai-bus.png",
      latitude: 18.9388,
      longitude: 72.8354,
      description: "Full-body bus wrap covering South–Western Mumbai daily.",
    },
    {
      adSpaceNumber: "AS-CHE-001",
      name: "OMR IT Corridor Hoarding",
      adSpaceType: "billboard",
      city: "Chennai",
      state: "Tamil Nadu",
      address: "Old Mahabalipuram Road, Sholinganallur",
      dimensions: "30x10 ft",
      basePrice: 62000,
      footfall: 90000,
      peakHours: "8–10 AM, 6–8 PM",
      photoUrl: "/ad-spaces/as-chennai-billboard.png",
      latitude: 12.9010,
      longitude: 80.2279,
      description: "Roadside hoarding on Chennai’s busiest IT corridor.",
    },
    {
      adSpaceNumber: "AS-HYD-001",
      name: "HITEC City Campus LED Wall",
      adSpaceType: "digital",
      city: "Hyderabad",
      state: "Telangana",
      address: "HITEC City, Madhapur",
      dimensions: "16x9 ft",
      basePrice: 110000,
      footfall: 60000,
      peakHours: "10 AM–7 PM",
      photoUrl: "/ad-spaces/as-hyderabad-led.png",
      latitude: 17.4474,
      longitude: 78.3762,
      description: "Evening LED wall at a high-footfall Hyderabad tech campus.",
    },
    {
      adSpaceNumber: "AS-DEL-002",
      name: "IGI Airport Departure Totem",
      adSpaceType: "digital",
      city: "New Delhi",
      state: "Delhi",
      address: "T3 Departures, IGI Airport",
      dimensions: "16x9 ft",
      basePrice: 175000,
      footfall: 110000,
      peakHours: "5–9 AM, 6–11 PM",
      photoUrl: "/ad-spaces/as-delhi-airport.png",
      latitude: 28.5562,
      longitude: 77.1000,
      description: "Premium digital totem in the international departure hall.",
    },
    {
      adSpaceNumber: "AS-MUM-004",
      name: "Bandra Taxi Fleet Door Panels",
      adSpaceType: "vehicle",
      city: "Mumbai",
      state: "Maharashtra",
      address: "Bandra–Kurla fleet (50 cabs)",
      dimensions: "10x10 ft",
      basePrice: 32000,
      footfall: 18000,
      peakHours: "All day",
      photoUrl: "/ad-spaces/as-mumbai-taxi.png",
      latitude: 19.0596,
      longitude: 72.8295,
      description: "Door and rooftop branding across a Bandra taxi fleet.",
    },
    {
      adSpaceNumber: "AS-BLR-002",
      name: "Outer Ring Road Billboard",
      adSpaceType: "billboard",
      city: "Bangalore",
      state: "Karnataka",
      address: "ORR, Marathahalli",
      dimensions: "40x20 ft",
      basePrice: 88000,
      footfall: 110000,
      peakHours: "8–11 AM, 6–9 PM",
      photoUrl: "/ad-spaces/as-bangalore-orr.png",
      latitude: 12.9569,
      longitude: 77.7011,
      description: "High-visibility hoarding on Bangalore’s Outer Ring Road IT stretch.",
    },
    {
      adSpaceNumber: "AS-HYD-002",
      name: "Hyderabad–Bengaluru Highway Hoarding",
      adSpaceType: "billboard",
      city: "Hyderabad",
      state: "Telangana",
      address: "NH-44 approach, Shamshabad side",
      dimensions: "30x10 ft",
      basePrice: 58000,
      footfall: 70000,
      peakHours: "7–10 AM, 5–8 PM",
      photoUrl: "/ad-spaces/as-hyderabad-billboard.png",
      latitude: 17.2403,
      longitude: 78.4294,
      description: "Highway hoarding on the Hyderabad–Bengaluru approach corridor.",
    },
    {
      adSpaceNumber: "AS-HBL-001",
      name: "PB Road Highway Billboard",
      adSpaceType: "billboard",
      city: "Hubli",
      state: "Karnataka",
      address: "Pune–Bangalore Road, near Gokul Road junction",
      dimensions: "40x20 ft",
      basePrice: 42000,
      footfall: 55000,
      peakHours: "8–10 AM, 6–8 PM",
      photoUrl: "/ad-spaces/as-hubli-pb-road.png",
      latitude: 15.3616,
      longitude: 75.1234,
      description: "Large highway billboard on PB Road, Hubli’s main commercial artery.",
    },
    {
      adSpaceNumber: "AS-HBL-002",
      name: "Keshwapur Junction Hoarding",
      adSpaceType: "billboard",
      city: "Hubli",
      state: "Karnataka",
      address: "Keshwapur Circle",
      dimensions: "30x10 ft",
      basePrice: 28000,
      footfall: 40000,
      peakHours: "9 AM–8 PM",
      photoUrl: "/ad-spaces/as-hubli-keshwapur.png",
      latitude: 15.3647,
      longitude: 75.1386,
      description: "Junction hoarding with all-day two-wheeler and city-bus visibility.",
    },
    {
      adSpaceNumber: "AS-HBL-003",
      name: "Unkal Lake Road Billboard",
      adSpaceType: "billboard",
      city: "Hubli",
      state: "Karnataka",
      address: "Unkal Lake Road, Vidyanagar",
      dimensions: "20x10 ft",
      basePrice: 22000,
      footfall: 25000,
      peakHours: "5–8 PM",
      photoUrl: "/ad-spaces/as-hubli-unkal.png",
      latitude: 15.3712,
      longitude: 75.1068,
      description: "Evening-traffic billboard on the Unkal Lake / Vidyanagar stretch.",
    },
    {
      adSpaceNumber: "AS-HBL-004",
      name: "Gokul Road Commercial Billboard",
      adSpaceType: "billboard",
      city: "Hubli",
      state: "Karnataka",
      address: "Gokul Road, opposite commercial complex",
      dimensions: "40x20 ft",
      basePrice: 36000,
      footfall: 48000,
      peakHours: "10 AM–7 PM",
      photoUrl: "/ad-spaces/as-hubli-gokul.png",
      latitude: 15.355,
      longitude: 75.132,
      description: "Premium 40×20 ft board on Gokul Road’s busiest shopping stretch.",
    },
  ];

  for (const sample of samples) {
    const organizationId = orgByCity[sample.city] || mumbaiOrgId;
    const extras = listingExtras[sample.adSpaceNumber];
    const existing = await prisma.adSpace.findFirst({
      where: { adSpaceNumber: sample.adSpaceNumber },
    });

    const { description, ...spaceData } = sample;
    const space = existing
      ? await prisma.adSpace.update({
          where: { id: existing.id },
          data: {
            ...spaceData,
            photoUrls: [sample.photoUrl],
            organizationId,
            rating: extras?.rating ?? 4.2,
            availableFrom,
            availableTo: extras?.availableTo ?? availableTo,
            imdStatus: "active",
            marketplaceListingStatus: "listed",
          },
        })
      : await prisma.adSpace.create({
          data: {
            organizationId,
            ...spaceData,
            photoUrls: [sample.photoUrl],
            rating: extras?.rating ?? 4.2,
            availableFrom,
            availableTo: extras?.availableTo ?? availableTo,
            imdStatus: "active",
            marketplaceListingStatus: "listed",
          },
        });

    await prisma.marketplaceListing.upsert({
      where: { adSpaceId: space.id },
      create: {
        adSpaceId: space.id,
        status: "approved",
        title: sample.name,
        description,
        submittedAt: new Date(),
        reviewedAt: new Date(),
      },
      update: {
        status: "approved",
        title: sample.name,
        description,
      },
    });
  }

  console.log(`Sample AdSpaces ready: ${samples.length} listed spaces`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
