import {
  type LoaderFunction,
  type MetaFunction,
  type ActionFunction,
  useLoaderData,
  useActionData,
  useTransition,
  redirect,
} from 'remix'
import { useState } from 'react'
import type { User } from '~/models/user.server'
import { json, Link, Form } from 'remix'
import { requireUser, requireUserId } from '~/session.server'
import { isPast, addDays } from 'date-fns'

import Container from '~/components/Container'
import Header from '~/components/dashboard/Header'
import Card from '~/components/Card'
import { headingStyles } from '~/components/Heading'
import Input from '~/components/Input'
import { SubmitButton } from '~/components/Buttons'
import { createDate } from '~/models/date.server'
import { badRequest, validateDate, validateTime } from '~/utils'
import { ErrorBadge } from '~/components/Badges'

type LoaderData = { user: User }

export const loader: LoaderFunction = async ({ request }) => {
  const user = await requireUser(request)
  return json({ user })
}

interface ActionData {
  formError?: string
  errors?: {
    date?: string
    startTime?: string
    endTime?: string
    isGroupDate?: string
    maxParticipants?: string
    note?: string
  }
  fields?: {
    date: string
    startTime: string
    endTime: string | null
    isGroupDate: boolean
    maxParticipants: number | null
    note: string | null
  }
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()

  const method = formData.get('_method')
  const date = formData.get('date')
  const startTime = formData.get('startTime')
  const endTime = formData.get('endTime')
  const isGroupDate = formData.get('isGroupDate')
  const maxParticipants = formData.get('maxParticipants')
  const note = formData.get('note')

  if (
    typeof method !== 'string' ||
    typeof date !== 'string' ||
    typeof startTime !== 'string'
  ) {
    return badRequest<ActionData>({
      formError: 'Pflichtfelder wurden nicht ausgefüllt',
    })
  }

  let fields = {
    date,
    startTime,
    endTime: typeof endTime === 'string' ? endTime : null,
    isGroupDate: isGroupDate === 'on',
    maxParticipants:
      typeof maxParticipants === 'string' ? parseInt(maxParticipants) : null,
    note: typeof note === 'string' ? note : null,
  }

  if (method === 'add') {
    // Validate date
    if (!validateDate(date)) {
      return badRequest<ActionData>({
        fields,
        errors: {
          date: 'Ungültiges Datum',
        },
      })
    }

    if (isPast(new Date(date))) {
      return badRequest<ActionData>({
        fields,
        errors: {
          date: 'Ungültiges Datum (zu früh)',
        },
      })
    }

    fields.date = new Date(date).toISOString()

    // Validate start and end time
    if (!validateTime(startTime)) {
      return badRequest<ActionData>({
        fields,
        errors: {
          startTime: 'Ungültige Uhrzeit',
        },
      })
    }

    if (fields.endTime && !validateTime(fields.endTime)) {
      return badRequest<ActionData>({
        fields,
        errors: {
          endTime: 'Ungültige Uhrzeit',
        },
      })
    }

    if (fields.endTime && fields.endTime < fields.startTime) {
      return badRequest<ActionData>({
        fields,
        errors: {
          endTime: 'Früher als Start',
        },
      })
    }

    // Validate maxParticipants
    if (fields.maxParticipants && isNaN(fields.maxParticipants)) {
      return badRequest<ActionData>({
        fields,
        errors: {
          maxParticipants: 'Keine gültige Zahl',
        },
      })
    }

    const userId = await requireUserId(request)

    await createDate(fields, userId)
    return redirect('/')
  }

  return badRequest<ActionData>({ formError: 'Ungültige Methode' })
}

export const meta: MetaFunction = () => {
  return {
    title: 'Neuer Termin',
  }
}

export default function CreateDate() {
  const { user } = useLoaderData() as LoaderData
  const actionData = useActionData<ActionData>()
  const transition = useTransition()
  const [isGroupDate, setIsGroupDate] = useState(false)

  const tomorrow = addDays(new Date(), 1).toLocaleDateString('en-CA')

  return (
    <div className="py-10">
      <Container>
        <Header username={user.name} />
        <Card withMarginTop>
          <h1 className={headingStyles}>Neuer Termin</h1>
          <Form className="mt-4" method="post">
            {actionData?.formError ? (
              <ErrorBadge message={actionData.formError} />
            ) : null}
            <fieldset disabled={transition.state === 'submitting'}>
              <div>
                <Input
                  name="date"
                  id="date"
                  label="Datum*"
                  type="date"
                  min={tomorrow}
                  defaultValue={
                    actionData?.errors?.date
                      ? actionData.fields?.date
                      : tomorrow
                  }
                  required
                  validationError={actionData?.errors?.date}
                />
              </div>

              <div className="mt-4 flex space-x-4">
                <div className="w-full">
                  <Input
                    name="startTime"
                    id="startTime"
                    label="Von*"
                    type="time"
                    defaultValue={actionData?.fields?.startTime}
                    validationError={actionData?.errors?.startTime}
                    required
                  />
                </div>
                <div className="w-full">
                  <Input
                    name="endTime"
                    id="endTime"
                    label="Bis"
                    type="time"
                    defaultValue={actionData?.fields?.endTime || undefined}
                    validationError={actionData?.errors?.endTime}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center">
                <input
                  id="groupDate"
                  name="isGroupDate"
                  type="checkbox"
                  defaultChecked={actionData?.fields?.isGroupDate}
                  onChange={e => setIsGroupDate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-200 focus:ring-opacity-50"
                />
                <label htmlFor="groupDate" className="ml-2 block">
                  Gruppentermin
                </label>
              </div>

              {isGroupDate && (
                <div className="mt-4">
                  <Input
                    label="Wie viele sollen mitmachen können?*"
                    id="maxParticipants"
                    name="maxParticipants"
                    type="number"
                    min={2}
                    defaultValue={actionData?.fields?.maxParticipants || 2}
                    pattern="[0-9]"
                    validationError={actionData?.errors?.maxParticipants}
                    required
                  />
                </div>
              )}

              <div className="mt-4">
                <Input
                  label="Notiz"
                  id="note"
                  name="note"
                  type="text"
                  defaultValue={actionData?.fields?.note || undefined}
                  validationError={actionData?.errors?.note}
                />
              </div>

              <input type="hidden" name="_method" value="add" />
            </fieldset>

            <div className="mt-8 flex items-center justify-between">
              <Link to="/" className="text-sm underline underline-offset-1">
                Zurück
              </Link>
              <SubmitButton
                type="submit"
                title="Speichern"
                disabled={transition.state === 'submitting'}
                label={
                  transition.state === 'submitting'
                    ? 'Speichert...'
                    : 'Speichern'
                }
              />
            </div>
          </Form>
        </Card>
      </Container>
    </div>
  )
}