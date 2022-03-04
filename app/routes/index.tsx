import {
  type LoaderFunction,
  useLoaderData,
  json,
  redirect,
  Form,
  type ActionFunction,
  type MetaFunction,
} from 'remix'
import { signOut, getUserSession } from '~/utils/session.server'

import Container from '~/components/Container'
import Card from '~/components/Card'

import { LogoutIcon } from '@heroicons/react/outline'
import invariant from 'tiny-invariant'

type NotVerifiedProps = {
  email: string
}

type User = {
  email?: string
  isVerified?: boolean
  name?: string
}

export const meta: MetaFunction = () => {
  return {
    title: 'Dashboard – miny',
  }
}

export const loader: LoaderFunction = async ({ request }) => {
  // Redirect to login if user is not authenticated
  const sessionUser = await getUserSession(request)
  if (!sessionUser) {
    return redirect('/login')
  }

  // Create the user object
  const user: User = {
    email: sessionUser.email,
    isVerified: sessionUser.email_verified,
    name: sessionUser.name,
  }

  return json({ user })
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const method = formData.get('method')?.toString()

  if (method === 'signout') {
    return signOut(request)
  }
}

export default function Dashboard() {
  const data = useLoaderData()
  const user: User = data.user

  invariant(user.email, 'User has no email')

  if (!user.isVerified) {
    return <NotVerified email={user.email} />
  }

  return (
    <div className='py-10'>
      <Container>
        <Form method='post'>
          <input type='hidden' name='method' value='signout' />
          <button
            type='submit'
            className='inline-flex items-center text-sm text-red-700 hover:text-red-600'
          >
            <LogoutIcon className='h-4 block mr-1' /> Abmelden
          </button>
        </Form>
        <Card>
          {/* <Avatar
            size={40}
            name={user.name}
            variant='beam'
            colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
          /> */}
          <div className='flex items-center'>
            <h1 className='mr-2 font-black font-serif text-2xl text-slate-800'>Hey {user.name}</h1>
            <img
              src='https://emojicdn.elk.sh/👋'
              alt='Winkende Hand Emoji'
              className='wave h-7'
              height='28'
            />
          </div>
          <p className='mt-4'>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Voluptas dolores id quo illum
            facere vel quia culpa? Atque necessitatibus similique nemo voluptatibus iusto,
            assumenda, minus, nisi ullam iste impedit voluptates?
          </p>
        </Card>
      </Container>
    </div>
  )
}

const NotVerified = ({ email }: NotVerifiedProps) => {
  return (
    <div className='mt-10 text-slate-800'>
      <Container>
        <Card>
          <div className='max-w-prose'>
            <h3 className='font-black font-serif text-2xl text-slate-800'>
              E-Mail Adresse bestätigen
            </h3>

            <p className='mt-4'>
              Du müsstest gleich eine Bestätigungsmail an deine E-Mail Adresse{' '}
              <span className='font-medium text-rose-600'>{email}</span> bekommen. Bitte folge den
              Anweisungen darin, um deine E-Mail Adresse zu bestätigen. Danach kannst du direkt
              loslegen.
            </p>

            <details className='mt-4 text-sm text-slate-500 cursor-pointer'>
              <summary>Warum muss ich meine E-Mail Adresse bestätigen?</summary>
              <p className='mt-1'>
                Sobald sich jemand für einen deiner Termine einträgt, schickt miny dir eine E-Mail,
                um dir Bescheid zu sagen. Damit diese E-Mail auch wirklich ankommt, musst du
                bestätigen, dass deine E-Mail Adresse korrekt ist.
              </p>
            </details>

            <div className='mt-6'>
              <button className='px-4 py-3 mr-2 inline-flex items-center bg-slate-700 border border-transparent rounded-md font-medium text-sm text-white hover:bg-slate-600 active:bg-slate-800 focus:outline-none focus:border-slate-800 focus:ring ring-slate-300 disabled:opacity-25 transition ease-in-out duration-150'>
                Ich habe keine E-Mail bekommen{' '}
                <img
                  src='https://emojicdn.elk.sh/🤔'
                  alt='Nachdenkliches Gesicht'
                  className='h-5 ml-1.5'
                />
              </button>

              <Form method='post' className='inline'>
                {/* <button
                type='submit'
                className='ml-2 px-4 py-2 mt-6 font-medium text-xs leading-6 shadow rounded-md text-white bg-emerald-500 transition-colors ease-in-out duration-150 hover:bg-emerald-400'
              >
                Ich habe meine E-Mail bestätigt
              </button> */}
                <button className='px-4 py-3 inline-flex items-center bg-green-700 border border-transparent rounded-md font-medium text-sm text-white hover:bg-green-600 active:bg-green-800 focus:outline-none focus:border-green-800 focus:ring ring-slate-300 disabled:opacity-25 transition ease-in-out duration-150'>
                  Erledigt{' '}
                  <img
                    src='https://emojicdn.elk.sh/👍'
                    alt='Daumen nach oben'
                    className='h-5 ml-1.5'
                  />
                </button>
              </Form>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  )
}
