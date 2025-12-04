import "dotenv/config"
import prisma from "../lib/prisma"

async function testDatabase() {
  console.log("🔍 Testing Prisma Postgres connection...\n")

  try {
    // Test 1: Check connection
    console.log("✅ Connected to database!")

    // Test 2: Create a test school
    console.log("\n📝 Creating a test school...")
    const newSchool = await prisma.school.create({
      data: {
        name: "Springfield Elementary",
        slug: `springfield-${Date.now()}`,
        email: "admin@springfield.edu",
      },
    })
    console.log("✅ Created school:", newSchool)

    // Test 3: Create a super admin user
    console.log("\n📝 Creating a super admin user...")
    const superAdmin = await prisma.user.create({
      data: {
        email: `admin-${Date.now()}@suku.com`,
        firstName: "Super",
        lastName: "Admin",
        role: "SUPER_ADMIN",
      },
    })
    console.log("✅ Created super admin:", superAdmin)

    // Test 4: Fetch all schools
    console.log("\n📋 Fetching all schools...")
    const allSchools = await prisma.school.findMany()
    console.log(`✅ Found ${allSchools.length} school(s):`)
    allSchools.forEach((school) => {
      console.log(`   - ${school.name} (${school.slug})`)
    })

    console.log("\n🎉 All tests passed! Your database is working perfectly.\n")
  } catch (error) {
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

testDatabase()
