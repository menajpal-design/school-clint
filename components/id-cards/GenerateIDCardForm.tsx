'use client'

import React, { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { IDCardPreview } from './IDCardPreview'
import DownloadButtons from './DownloadButtons'

const schema = z.object({
  name: z.string().min(1),
  id: z.string().min(1),
  role: z.union([z.literal('student'), z.literal('teacher'), z.literal('staff')]).default('student'),
})

type FormValues = z.infer<typeof schema>

export function GenerateIDCardForm() {
  const { register, handleSubmit } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: 'student' } })
  const [data, setData] = useState<FormValues | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)

  const onSubmit = (vals: FormValues) => {
    setData(vals)
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
        <div>
          <label className="text-sm">Name</label>
          <Input {...register('name')} />
        </div>
        <div>
          <label className="text-sm">ID</label>
          <Input {...register('id')} />
        </div>
        <div>
          <label className="text-sm">Type</label>
          <select {...register('role')} className="w-full border rounded px-2 py-1">
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div>
          <Button type="submit">Preview</Button>
        </div>
      </form>

      <div>
        <div className="mb-2">
          <strong>Preview</strong>
        </div>
        <div ref={previewRef as any}>
          {data ? (
            <IDCardPreview
              type={data.role as any}
              name={data.name}
              id={data.id}
              qrData={`${data.role}:${data.id}:${data.name}`}
              barcode={data.id}
            />
          ) : (
            <div className="text-sm text-muted-foreground">Fill the form and click preview</div>
          )}
        </div>

        <div className="mt-3">
          <DownloadButtons targetRef={previewRef} filename={data ? `id-${data.id}` : 'id-card'} cardId={data?.id} />
        </div>
      </div>
    </div>
  )
}

export default GenerateIDCardForm
