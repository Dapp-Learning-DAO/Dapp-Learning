import Head from 'next/head'
import Cards from '../components/cards'
import {
  Container,
  Main,
  Title,
  Description,
  CodeTag,
} from '../components/sharedstyles'

export default function Home() {
  return (
    <Container>
      <Head>
        <title>UniswapV2 Interface</title>
        <meta name="description" content="UniswapV2 Interface with wagmi and nextjs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Main>
        <Title>
          UniswapV2
        </Title>

        <Description>
          A simple Interface with wagmi and nextjs of UniswapV2.
        </Description>
        
        <Cards pages={[
          {href: '/swap', name: 'Swap page'}
        ]} />
      </Main>
    </Container>
  )
}

