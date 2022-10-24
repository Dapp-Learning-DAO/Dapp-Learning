import styled from 'styled-components'

const Container = styled.div`
  padding: 0 0.5rem;
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  height: 100vh;
  min-height: 100vh;
`
const Main = styled.main`
  padding: 5rem 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

const Title = styled.h1`
  margin: 0;
  line-height: 1.15;
  font-size: 4rem;
  text-align: center;
  text-decoration: none;

  a {
    color: ${({ theme }) => theme.colors.secondary};
    text-decoration: none;
    &:hover,
    :focus,
    :active {
      text-decoration: underline;
    }
  }
`

const Description = styled.p`
  text-align: center;
  line-height: 1.5;
  font-size: 1.5rem;
`
const CodeTag = styled.code`
  background: #fafafa;
  border-radius: 5px;
  margin: 0 0.75rem;
  padding: 0.75rem;
  font-size: 1.1rem;
  font-family: Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono,
    Bitstream Vera Sans Mono, Courier New, monospace;
`


const SwapBox = styled.div`
  display: flex;
  width: 100%;
`;
const TokenList = styled.div`
  flex: 1;
  padding: 16px;
  min-width: 200px;

  label {
    padding: 16px;
    display: block;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
  }

  input[type="text"] {
    margin: 16px 0;
    padding: 8px;
    max-width: 90%;
    height: 28px;
    line-height: 28px;
    font-size: 24px;
  }
`;
const RainbowButton = styled.button`
  cursor: pointer;
  display: flex;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.2rem;
  height: 3.4rem;
  line-height: 1.6rem;
  letter-spacing: 0.1rem;
  padding: 0.8rem 1.8rem;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  position: relative;
  z-index: 0;
  color: rgb(255, 255, 255);
  border-color: transparent;
  width: 50%;
  max-width: 500px;
  border-radius: 0.8rem;

  ::before {
    content: "";
    position: absolute;
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 1;
    background: linear-gradient(
        45deg,
        rgb(255, 0, 0),
        rgb(255, 115, 0),
        rgb(255, 251, 0),
        rgb(72, 255, 0),
        rgb(0, 255, 213),
        rgb(0, 43, 255),
        rgb(122, 0, 255),
        rgb(255, 0, 200),
        rgb(255, 0, 0)
      )
      0% 0% / 400%;
    animation: 10s linear 0s infinite normal none running moving;
    transition: opacity 0.3s ease-in-out 0s;
    border-radius: 0.8rem;
  }

  ::after {
    z-index: -1;
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: rgb(17, 17, 17);
    left: 0px;
    top: 0px;
    border-radius: 0.8rem;
  }

  :active {
    color: rgb(0, 0, 0);
  }

  :active::after {
    background: transparent;
  }

  &.rainbow::before {
    filter: blur(5px);
    top: -2px;
    left: -2px;
    width: calc(100% + 4px);
    height: calc(100% + 4px);
  }

  &.rainbow::after {
  }

  @keyframes moving {
    0% {
      background-position-x: 0%;
    }
    50% {
      background-position-x: 100%;
    }
    100% {
      background-position-x: 0%;
    }
  }

  &[disabled] {
    color: rgb(200, 200, 200);
  }
  &[disabled]:active::after {
    background: rgb(17, 17, 17);
  }

  @media screen and (max-width: 1280px}) {
    max-width: none;
    font-size: 1rem;
    width: 100%;
  }
`

export { Container, Main, Title, Description, CodeTag, SwapBox, TokenList, RainbowButton }
