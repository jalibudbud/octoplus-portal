import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { RepoSchema, FieldDef } from '@/lib/schema'
import type { ColumnMapping } from '@/lib/file-reader'

interface ColumnMapperProps {
  schema: RepoSchema
  sourceColumns: string[]
  mapping: ColumnMapping
  onMappingChange: (fieldName: string, sourceColumn: string | null) => void
  onConfirm: () => void
}

const SKIP_VALUE = '__skip__'

function FieldOptions({ field, sourceColumns }: { field: FieldDef; sourceColumns: string[] }) {
  if (field.type === 'enum' && field.enumOptions) {
    return field.enumOptions
      .filter((opt) => opt.value !== '')
      .map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>
          {opt.label}
        </SelectItem>
      ))
  }
  return sourceColumns.map((col) => (
    <SelectItem key={col} value={col}>
      {col}
    </SelectItem>
  ))
}

export function ColumnMapper({
  schema,
  sourceColumns,
  mapping,
  onMappingChange,
  onConfirm,
}: ColumnMapperProps) {
  const visibleFields = schema.fields.filter((f): f is FieldDef => f.locked === undefined)

  const requiredUnmapped = visibleFields.filter(
    (f) => f.required && !mapping[f.name] && !f.defaultValue,
  )
  const canConfirm = requiredUnmapped.length === 0

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium mb-1">Map source columns to Octo+ fields</p>
        <p className="text-[10px] text-muted-foreground">
          Required fields (<span className="text-destructive">*</span>) must be mapped before continuing.
        </p>
      </div>

      <div className="border border-border divide-y divide-border">
        {visibleFields.map((field) => (
          <div key={field.name} className="flex items-center gap-3 px-3 py-2">
            <div className="w-44 shrink-0">
              <p className="">
                {field.name}
                {field.required && <span className="text-destructive ml-0.5">*</span>}
              </p>
              <p className="text-[9px] text-muted-foreground">{field.label}</p>
            </div>
            <Select
              value={mapping[field.name] || field.defaultValue || SKIP_VALUE}
              onValueChange={(val) =>
                onMappingChange(field.name, val === SKIP_VALUE ? null : (val as string))
              }
            >
              <SelectTrigger className="flex-1 min-w-0">
                <SelectValue placeholder="— skip —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SKIP_VALUE}>— skip —</SelectItem>
                <FieldOptions field={field} sourceColumns={sourceColumns} />
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {requiredUnmapped.length > 0 && (
        <p className="text-[10px] text-destructive">
          {requiredUnmapped.length} required field{requiredUnmapped.length > 1 ? 's' : ''} still unmapped:{' '}
          {requiredUnmapped.map((f) => f.name).join(', ')}
        </p>
      )}

      <Button onClick={onConfirm} disabled={!canConfirm} className="w-full">
        Apply mapping &amp; preview
      </Button>
    </div>
  )
}
