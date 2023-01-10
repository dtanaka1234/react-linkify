// @flow

import * as React from 'react';

import defaultComponentDecorator from 'decorators/defaultComponentDecorator';
import defaultHrefDecorator from 'decorators/defaultHrefDecorator';
import defaultMatchDecorator from 'decorators/defaultMatchDecorator';
import defaultTextDecorator from 'decorators/defaultTextDecorator';

type Props = {
  children: React.Node,
  componentDecorator: (string, string, number) => React.Node,
  hrefDecorator: (string) => string,
  matchDecorator: (string) => Array<Object>,
  textDecorator: (string) => string,
  matchesFoundCallback: (string[]) => void;
};

type State = {
  sentMatches: boolean,
}

class Linkify extends React.Component<Props, State> {
  static defaultProps = {
    componentDecorator: defaultComponentDecorator,
    hrefDecorator: defaultHrefDecorator,
    matchDecorator: defaultMatchDecorator,
    textDecorator: defaultTextDecorator,
  };

  constructor() {
    super();
    this.state = {
      sentMatches: false,
    };
  }

  parseString(string: string, carry: string[]) {
    if (string === '') {
      return string;
    }

    const matches = this.props.matchDecorator(string);
    if (!matches) {
      return string;
    }

    const elements = [];
    let lastIndex = 0;
    matches.forEach((match, i) => {
      // Push preceding text if there is any
      if (match.index > lastIndex) {
        elements.push(string.substring(lastIndex, match.index));
      }

      const decoratedHref = this.props.hrefDecorator(match.url);
      carry.push(match.url)
      const decoratedText = this.props.textDecorator(match.text);
      const decoratedComponent = this.props.componentDecorator(decoratedHref, decoratedText, i);
      elements.push(decoratedComponent);

      lastIndex = match.lastIndex;
    });

    // Push remaining text if there is any
    if (string.length > lastIndex) {
      elements.push(string.substring(lastIndex));
    }

    return (elements.length === 1) ? elements[0] : elements;
  }

  parse(children: any, key: number = 0, carry) {
    if (typeof children === 'string') {
      return this.parseString(children, carry);
    } else if (React.isValidElement(children) && (children.type !== 'a') && (children.type !== 'button')) {
      return React.cloneElement(children, {key: key}, this.parse(children.props.children, 0, carry));
    } else if (Array.isArray(children)) {
      return children.map((child, i) => this.parse(child, i, carry));
    }

    return children;
  }

  componentDidMount() {
    this.setState({ sentMatches: true });
  }

  render(): React.Node {
    const urlMatches = [];
    const children = this.parse(this.props.children, 0, urlMatches);

    if (!this.state.sentMatches) {
      this.props.matchesFoundCallback(urlMatches);
    }

    return (
      <React.Fragment>
        {children}
      </React.Fragment>
    );
  }
}

export default Linkify;
