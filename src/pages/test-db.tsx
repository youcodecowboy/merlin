import { GetServerSideProps } from 'next'
import prisma from '../lib/prisma'

type Props = {
  count?: number
  error?: string
}

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  try {
    const count = await prisma.item.count()
    return {
      props: {
        count
      }
    }
  } catch (error) {
    console.error('Database error:', error)
    return {
      props: {
        error: 'Failed to connect to database'
      }
    }
  }
}

export default function TestDB({ count, error }: Props) {
  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-red-500">Error:</h1>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1>Database Test</h1>
      <p>Number of items in database: {count}</p>
    </div>
  )
} 