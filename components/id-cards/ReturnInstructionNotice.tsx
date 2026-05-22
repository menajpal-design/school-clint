export default function ReturnInstructionNotice({ address, phone, email, website }: { address?: string; phone?: string; email?: string; website?: string }) {
  return (
    <div style={{ position: 'absolute', left: 446, right: 18, bottom: 28, zIndex: 20, display: 'grid', gap: 4, padding: '5px 6px', background: 'rgba(255,255,255,0.94)', borderTop: '1px solid rgba(8,47,58,0.18)', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: 8.2, lineHeight: '11px', fontWeight: 700, color: '#082f3a' }}>
      <div style={{ fontWeight: 900, color: '#0f3f49', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Return Instruction</div>
      <div>If found outside, please return this ID card to the school address below.</div>
      {address ? <div><b>School Address: </b>{address}</div> : null}
      {phone ? <div><b>Phone: </b>{phone}</div> : null}
      {email ? <div><b>Email: </b>{email}</div> : null}
      {website ? <div><b>Website: </b>{website}</div> : null}
    </div>
  )
}
