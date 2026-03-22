import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "RecruitMonster"

interface Props {
  candidateName?: string
  message?: string
}

const OfferLetterEmail = ({ candidateName, message }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Offer Letter from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 Congratulations!</Heading>
        <Text style={text}>
          {candidateName ? `Dear ${candidateName},` : 'Dear Candidate,'}
        </Text>
        <Text style={text}>
          {message || 'We are excited to extend an offer for the position. Please review the details.'}
        </Text>
        <Text style={footer}>Best regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OfferLetterEmail,
  subject: 'Offer Letter - Congratulations!',
  displayName: 'Offer Letter',
  previewData: { candidateName: 'Jane Doe', message: 'We are thrilled to offer you the Senior Developer position at our company.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '700' as const, color: '#1a1a2e', margin: '0 0 24px' }
const text = { fontSize: '15px', color: '#3a3a4a', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '13px', color: '#888899', margin: '32px 0 0', borderTop: '1px solid #e8e8ee', paddingTop: '16px' }
