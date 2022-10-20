import Link from 'next/link'
import { Container, Main, Title, Description } from '../components/sharedstyles'
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function About() {
  return (
    <Container>
      <Main>
        <Title>Swap</Title>
        <Description>
          <Link href="/">
            <a>&larr; Go Back</a>
          </Link>
        </Description>
        <ConnectButton />
      </Main>
    </Container>
  )
}
