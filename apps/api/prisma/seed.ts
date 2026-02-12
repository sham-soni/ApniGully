import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create neighborhoods
  const bandraWest = await prisma.neighborhood.create({
    data: {
      name: 'Bandra West',
      slug: 'bandra-west-mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      latitude: 19.0596,
      longitude: 72.8295,
      radius: 500,
      inviteCode: 'BANDRA01',
      memberCount: 0,
    },
  });

  const koramangala = await prisma.neighborhood.create({
    data: {
      name: 'Koramangala',
      slug: 'koramangala-bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      latitude: 12.9352,
      longitude: 77.6245,
      radius: 500,
      inviteCode: 'KORAMA01',
      memberCount: 0,
    },
  });

  console.log('Created neighborhoods');

  // Create buildings
  const seaview = await prisma.building.create({
    data: {
      neighborhoodId: bandraWest.id,
      name: 'Sea View Apartments',
      address: '123 Beach Road, Bandra West',
      type: 'apartment',
      unitCount: 50,
    },
  });

  const sunriseT = await prisma.building.create({
    data: {
      neighborhoodId: bandraWest.id,
      name: 'Sunrise Towers',
      address: '456 Hill Road, Bandra West',
      type: 'society',
      unitCount: 100,
    },
  });

  console.log('Created buildings');

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        phone: '9876543210',
        name: 'Rahul Sharma',
        language: 'en',
        isVerified: true,
        trustScore: 85,
        endorsementCount: 5,
      },
    }),
    prisma.user.create({
      data: {
        phone: '9876543211',
        name: 'Priya Patel',
        language: 'en',
        isVerified: true,
        trustScore: 90,
        endorsementCount: 8,
      },
    }),
    prisma.user.create({
      data: {
        phone: '9876543212',
        name: 'Amit Kumar',
        language: 'hi',
        isVerified: false,
        trustScore: 60,
      },
    }),
    prisma.user.create({
      data: {
        phone: '9876543213',
        name: 'Sunita Devi',
        language: 'hi',
        isVerified: true,
        trustScore: 75,
      },
    }),
    prisma.user.create({
      data: {
        phone: '9876543214',
        name: 'Mohan Lal',
        language: 'hi',
        isVerified: true,
        trustScore: 80,
      },
    }),
  ]);

  const [rahul, priya, amit, sunita, mohan] = users;
  console.log('Created users');

  // Create memberships
  await prisma.membership.createMany({
    data: [
      { userId: rahul.id, neighborhoodId: bandraWest.id, buildingId: seaview.id, role: 'admin', unit: 'A-101', verificationStatus: 'verified' },
      { userId: priya.id, neighborhoodId: bandraWest.id, buildingId: seaview.id, role: 'moderator', unit: 'A-203', verificationStatus: 'verified' },
      { userId: amit.id, neighborhoodId: bandraWest.id, buildingId: sunriseT.id, role: 'resident', unit: 'B-501', verificationStatus: 'pending' },
      { userId: sunita.id, neighborhoodId: bandraWest.id, role: 'helper', verificationStatus: 'verified' },
      { userId: mohan.id, neighborhoodId: bandraWest.id, role: 'shop_owner', verificationStatus: 'verified' },
    ],
  });

  await prisma.neighborhood.update({
    where: { id: bandraWest.id },
    data: { memberCount: 5 },
  });

  console.log('Created memberships');

  // Create micro groups
  const parentsGroup = await prisma.microGroup.create({
    data: {
      neighborhoodId: bandraWest.id,
      name: 'Parents Group',
      description: 'For parents with young children',
      type: 'interest',
      isPrivate: false,
      memberCount: 2,
    },
  });

  await prisma.groupMember.createMany({
    data: [
      { groupId: parentsGroup.id, userId: rahul.id, isAdmin: true },
      { groupId: parentsGroup.id, userId: priya.id },
    ],
  });

  console.log('Created groups');

  // Create posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        userId: rahul.id,
        neighborhoodId: bandraWest.id,
        type: 'announcement',
        title: 'Welcome to ApniGully!',
        content: 'Welcome to our neighborhood community. Please introduce yourself and feel free to share helpful information with your neighbors.',
        tags: ['welcome', 'community'],
        isPinned: true,
      },
    }),
    prisma.post.create({
      data: {
        userId: priya.id,
        neighborhoodId: bandraWest.id,
        type: 'request',
        title: 'Looking for reliable plumber',
        content: 'Need a plumber urgently for bathroom leak. Please recommend if you know someone reliable. Budget is around Rs 500-1000.',
        tags: ['plumber', 'urgent', 'home-repair'],
      },
    }),
    prisma.post.create({
      data: {
        userId: amit.id,
        neighborhoodId: bandraWest.id,
        type: 'recommendation',
        title: 'Great electrician recommendation',
        content: 'Ramesh Electrician did excellent work at my place. Very professional and reasonable rates. Contact him at the number mentioned in directory.',
        tags: ['electrician', 'recommendation'],
      },
    }),
  ]);

  console.log('Created posts');

  // Create rental listing
  const rentalPost = await prisma.post.create({
    data: {
      userId: rahul.id,
      neighborhoodId: bandraWest.id,
      type: 'rental',
      title: '2BHK for rent in Sea View Apartments',
      content: 'Spacious 2BHK apartment available for rent. Well ventilated, sea facing, fully furnished. Walking distance to Bandra station. Family preferred.',
      tags: ['2bhk', 'furnished', 'sea-view'],
    },
  });

  await prisma.rentalListing.create({
    data: {
      postId: rentalPost.id,
      userId: rahul.id,
      neighborhoodId: bandraWest.id,
      propertyType: 'apartment',
      bhk: '2BHK',
      rentAmount: 45000,
      depositAmount: 90000,
      furnishing: 'fully_furnished',
      availableFrom: new Date(),
      area: 850,
      floor: 5,
      totalFloors: 12,
      amenities: ['parking', 'gym', 'security', 'power-backup'],
      status: 'available',
      contactPreference: 'chat',
    },
  });

  console.log('Created rental listing');

  // Create helper profile
  await prisma.helperProfile.create({
    data: {
      userId: sunita.id,
      neighborhoodId: bandraWest.id,
      skills: ['maid', 'cook'],
      experience: 10,
      languages: ['hi', 'en'],
      hourlyRate: 150,
      monthlyRate: 8000,
      availability: {
        monday: [{ start: '08:00', end: '12:00' }, { start: '16:00', end: '20:00' }],
        tuesday: [{ start: '08:00', end: '12:00' }, { start: '16:00', end: '20:00' }],
        wednesday: [{ start: '08:00', end: '12:00' }, { start: '16:00', end: '20:00' }],
        thursday: [{ start: '08:00', end: '12:00' }, { start: '16:00', end: '20:00' }],
        friday: [{ start: '08:00', end: '12:00' }, { start: '16:00', end: '20:00' }],
        saturday: [{ start: '08:00', end: '12:00' }],
        sunday: [],
      },
      backgroundCheckStatus: 'verified',
      documentsVerified: true,
      referenceCount: 5,
      rating: 4.5,
      reviewCount: 12,
      bio: 'Experienced cook and maid with 10+ years of experience. Specializing in North Indian and South Indian cuisine.',
      isActive: true,
    },
  });

  console.log('Created helper profile');

  // Create shop
  const shop = await prisma.shop.create({
    data: {
      userId: mohan.id,
      neighborhoodId: bandraWest.id,
      name: 'Mohan General Store',
      category: 'Grocery',
      description: 'Your neighborhood general store. Fresh vegetables, fruits, and daily essentials.',
      address: '78 Hill Road, Near Sunrise Towers',
      phone: '9876543214',
      hours: {
        monday: { open: '08:00', close: '21:00' },
        tuesday: { open: '08:00', close: '21:00' },
        wednesday: { open: '08:00', close: '21:00' },
        thursday: { open: '08:00', close: '21:00' },
        friday: { open: '08:00', close: '21:00' },
        saturday: { open: '08:00', close: '22:00' },
        sunday: { open: '09:00', close: '14:00' },
      },
      isVerified: true,
      rating: 4.2,
      reviewCount: 25,
    },
  });

  // Create offer
  await prisma.offer.create({
    data: {
      shopId: shop.id,
      title: '10% off on all vegetables',
      description: 'Fresh vegetables at discounted prices. Valid for this week only!',
      discountPercent: 10,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  console.log('Created shop and offer');

  // Create endorsements
  await prisma.endorsement.createMany({
    data: [
      { endorserId: priya.id, endorseeId: rahul.id, type: 'trust', message: 'Very helpful neighbor' },
      { endorserId: rahul.id, endorseeId: priya.id, type: 'reliability', message: 'Always responsive' },
      { endorserId: rahul.id, endorseeId: sunita.id, type: 'skill', message: 'Excellent cook!' },
    ],
  });

  console.log('Created endorsements');

  // Create reviews
  await prisma.review.createMany({
    data: [
      {
        userId: rahul.id,
        targetType: 'helper',
        helperProfileId: (await prisma.helperProfile.findFirst({ where: { userId: sunita.id } }))!.id,
        rating: 5,
        content: 'Sunita is an excellent cook. Her food is always delicious and she maintains great hygiene.',
        isVerified: true,
      },
      {
        userId: priya.id,
        targetType: 'shop',
        shopId: shop.id,
        rating: 4,
        content: 'Good quality products at reasonable prices. Nice owner.',
        isVerified: false,
      },
    ],
  });

  console.log('Created reviews');

  // Create digest preferences
  await prisma.digestPreference.createMany({
    data: [
      { userId: rahul.id, neighborhoodId: bandraWest.id, frequency: 'daily', preferredTime: '09:00' },
      { userId: priya.id, neighborhoodId: bandraWest.id, frequency: 'weekly', preferredTime: '10:00' },
    ],
  });

  console.log('Created digest preferences');

  console.log('Seeding completed!');
  console.log('\n=== Demo Accounts ===');
  console.log('Phone: 9876543210 (Admin - Rahul Sharma)');
  console.log('Phone: 9876543211 (Moderator - Priya Patel)');
  console.log('Phone: 9876543212 (Resident - Amit Kumar)');
  console.log('Phone: 9876543213 (Helper - Sunita Devi)');
  console.log('Phone: 9876543214 (Shop Owner - Mohan Lal)');
  console.log('\nNeighborhood Invite Codes:');
  console.log('Bandra West: BANDRA01');
  console.log('Koramangala: KORAMA01');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
