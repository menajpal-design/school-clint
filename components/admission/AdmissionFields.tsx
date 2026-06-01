import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ControlledProps = {
  values: Record<string, any>;
  onChange: (key: string, value: string) => void;
};

type RhfProps = {
  form?: any; // react-hook-form object
  names?: Record<string, string>;
};

type Props = Partial<ControlledProps & RhfProps> & { prefix?: string };

export default function AdmissionFields({ values = {}, onChange, form, names = {}, prefix = '' }: Props) {
  const fieldName = (key: string) => (names && names[key]) || `${prefix}${key}`;

  if (form) {
    // react-hook-form mode
    return (
      <>
        <FormField control={form.control} name={fieldName('name')} render={({ field }: any) => (
          <FormItem>
            <FormLabel>Student Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={fieldName('dateOfBirth')} render={({ field }: any) => (
          <FormItem>
            <FormLabel>Date of Birth</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={fieldName('address')} render={({ field }: any) => (
          <FormItem>
            <FormLabel>Address</FormLabel>
            <FormControl><Textarea {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={fieldName('previousSchool')} render={({ field }: any) => (
          <FormItem>
            <FormLabel>Previous School</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={fieldName('previousResult')} render={({ field }: any) => (
          <FormItem>
            <FormLabel>Previous Result</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={fieldName('guardianName')} render={({ field }: any) => (
          <FormItem>
            <FormLabel>Guardian Name</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={fieldName('guardianPhone')} render={({ field }: any) => (
          <FormItem>
            <FormLabel>Guardian Phone</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name={fieldName('guardianEmail')} render={({ field }: any) => (
          <FormItem>
            <FormLabel>Guardian Email</FormLabel>
            <FormControl><Input type="email" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
      </>
    );
  }

  // Controlled mode (public page)
  return (
    <>
      <Input placeholder="Student Name" value={values.studentName || ''} onChange={(e) => onChange?.('studentName', e.target.value)} />
      <Input type="date" placeholder="Date of Birth" value={values.dateOfBirth || ''} onChange={(e) => onChange?.('dateOfBirth', e.target.value)} />
      <Textarea placeholder="Address" value={values.address || ''} onChange={(e) => onChange?.('address', e.target.value)} />
      <Input placeholder="Previous School" value={values.previousSchool || ''} onChange={(e) => onChange?.('previousSchool', e.target.value)} />
      <Input placeholder="Previous Result" value={values.previousResult || ''} onChange={(e) => onChange?.('previousResult', e.target.value)} />
      <Input placeholder="Guardian Name" value={values.guardianName || ''} onChange={(e) => onChange?.('guardianName', e.target.value)} />
      <Input placeholder="Guardian Phone" value={values.guardianPhone || ''} onChange={(e) => onChange?.('guardianPhone', e.target.value)} />
      <Input placeholder="Guardian Email" type="email" value={values.guardianEmail || ''} onChange={(e) => onChange?.('guardianEmail', e.target.value)} />
    </>
  );
}
