import type { User, Prisma, Date } from '@prisma/client'
import { prisma } from '~/db.server'

export type DateWithParticipants = Prisma.DateGetPayload<{
  include: {
    participants: {
      select: {
        name: true
      }
    }
  }
}>

export async function isOwner(ownerId: Date['userId'], userId: User['id']) {
  return ownerId === userId
}

export async function getDateById(id: Date['id']) {
  return prisma.date.findUnique({
    where: { id },
  })
}

export async function getDatesByUserId(id: User['id']) {
  return prisma.date.findMany({
    where: {
      userId: id,
    },
    orderBy: {
      date: 'asc',
    },
    include: {
      participants: {
        select: {
          name: true,
        },
      },
    },
  })
}

interface CreateFields {
  date: string
  startTime: string
  endTime?: string | null
  isGroupDate?: boolean
  maxParticipants?: number | null
  note?: string | null
}

export async function createDate(fields: CreateFields, userId: string) {
  return await prisma.date.create({
    data: {
      date: fields.date,
      startTime: fields.startTime,
      endTime: fields.endTime,
      isGroupDate: fields.isGroupDate,
      maxParticipants: fields.maxParticipants,
      note: fields.note,
      userId: Number(userId),
    },
  })
}

interface UpdateFields extends CreateFields {
  id: number
}

export async function updateDate(fields: UpdateFields) {
  return await prisma.date.update({
    where: {
      id: fields.id,
    },
    data: {
      date: fields.date,
      startTime: fields.startTime,
      endTime: fields.endTime,
      isGroupDate: fields.isGroupDate,
      maxParticipants: fields.maxParticipants,
      note: fields.note,
    },
  })
}

export async function deleteDate(id: Date['id'], userId: User['id']) {
  const date = await getDateById(id)

  if (!date) return null

  if (!isOwner(date.id, userId)) {
    return null
  }

  return await prisma.date.delete({
    where: {
      id,
    },
  })
}