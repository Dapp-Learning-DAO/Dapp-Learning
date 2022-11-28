import styled from 'styled-components';
import Link from 'next/link';

export const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-flow: column wrap;
  max-width: 800px;
  margin-top: 3rem;
`;

export const Card = styled.div`
  padding: 1.5rem;
  color: inherit;
  text-decoration: none;
  border: 1px solid black;
  border-radius: 10px;
  transition: color 0.15s ease, border-color 0.15s ease;
  width: 100%;

  &:hover,
  :focus,
  :active {
    color: #0070f3;
    border-color: #0070f3;
  }
`;

const StyledA = styled.a`
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
`;

const StyledLink = ({ href, name }) => (
  <Link href={href} passHref>
    <StyledA>{name}&rarr;</StyledA>
  </Link>
);

interface PageProp {
  href: string;
  name: string;
}
export default function Cards(props: { pages: PageProp[] }) {
  return (
    <FlexContainer>
      <Card>
        {props.pages.map((item, index) => (
          <StyledLink key={index} href={item.href} name={`${item.name}`} />
        ))}
      </Card>
    </FlexContainer>
  );
}
