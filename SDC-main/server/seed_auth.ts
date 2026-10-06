import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const url = process.env.SUPABASE_URL!
const secretKey = process.env.SUPABASE_SERVICE_KEY!

const admin = createClient(url, secretKey)

async function seedAuthUsers() {
  console.log('--- Ensuring Base & Designated Admin Users in Supabase Auth ---')

  const defaultUsers = [
    {
      email: '2501011010045@goa.paruluniversity.ac.in',
      password: 'raziyaptp45#',
      name: 'Raziya Sultana',
      role: 'admin',
    },
    {
      email: '2501011010073@goa.paruluniversity.ac.in',
      password: 'functionalchiku73#',
      name: 'Tanishq Naik',
      role: 'admin',
    },
    {
      email: '2501011010066@goa.paruluniversity.ac.in',
      password: 'shrinotshre66#',
      name: 'Shriyansh Narvekar',
      role: 'admin',
    },
    {
      email: '2501011010083@goa.paruluniversity.ac.in',
      password: 'yashendfront83#',
      name: 'Yash Mukade',
      role: 'admin',
    },
    {
      email: '2501011010087@goa.paruluniversity.ac.in',
      password: 'priyalkdo87#',
      name: 'Priyal Nagvekar',
      role: 'admin',
    },
    {
      email: '2501011010012@goa.paruluniversity.ac.in',
      password: 'abhinahiskdl12#',
      name: 'Abhimanyu Dixit',
      role: 'admin',
    },
    {
      email: '2501011010062@goa.paruluniversity.ac.in',
      password: 'bhise484@shravan62#',
      name: 'Shravan Bhise',
      role: 'admin',
    },
    {
      email: '2503031010009@goa.paruluniversity.ac.in',
      password: 'kumaraaryangd09#',
      name: 'Aaryan Kumar Tiwari',
      role: 'admin',
    },
    {
      email: 'admin@sdc.club',
      password: 'Admin@SDC2026!',
      name: 'Admin Lead',
      role: 'admin',
    },
    {
      email: 'member@sdc.club',
      password: 'Member@SDC2026!',
      name: 'Alex Dev',
      role: 'member',
    },
  ]

  const { data: existing, error: listErr } = await admin.auth.admin.listUsers()
  if (listErr) {
    console.error('Failed to list existing auth users:', listErr)
    return
  }

  for (const u of defaultUsers) {
    const found = existing.users.find((eu) => eu.email?.toLowerCase() === u.email.toLowerCase())
    if (found) {
      console.log(`Updating user ${u.email} (id: ${found.id}) in Supabase Auth...`)
      // Ensure user metadata role, confirmed email, and password are set
      const { error: updateErr } = await admin.auth.admin.updateUserById(found.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role, member_type: 'university' },
      })
      if (updateErr) {
        console.error(`Failed to update ${u.email}:`, updateErr.message)
      } else {
        console.log(`✓ Updated & confirmed ${u.email} with role: ${u.role}`)
        try {
          await admin.from('profiles').upsert([
            {
              id: found.id,
              email: u.email,
              full_name: u.name,
              role: u.role,
              approval_status: 'approved',
              member_type: 'university',
            },
          ], { onConflict: 'id' })
        } catch (err: any) {
          console.warn('Profile upsert note:', err?.message)
        }
      }
    } else {
      console.log(`Creating user ${u.email} in Supabase Auth...`)
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.name, role: u.role, member_type: 'university' },
      })
      if (error) {
        console.error(`Failed to create ${u.email}:`, error.message)
      } else {
        console.log(`✓ Created ${u.email} in Supabase Auth (id: ${data.user.id}, role: ${u.role})`)
        try {
          await admin.from('profiles').upsert([
            {
              id: data.user.id,
              email: u.email,
              full_name: u.name,
              role: u.role,
              approval_status: 'approved',
              member_type: 'university',
            },
          ], { onConflict: 'id' })
        } catch (err: any) {
          console.warn('Profile upsert note:', err?.message)
        }
      }
    }
  }
}

seedAuthUsers()
