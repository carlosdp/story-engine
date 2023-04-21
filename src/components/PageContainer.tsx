import { Box, useStyleConfig } from '@chakra-ui/react';
import { CSSProperties } from 'react';

export type PageContainerProps = {
  style?: CSSProperties;
  variant?: 'full-bleed';
  children: React.ReactNode;
};

export const PageContainer = ({ style, variant, children }: PageContainerProps) => {
  const styles = useStyleConfig('PageContainer', { variant });

  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%" height="100%" style={style}>
      <Box flexDirection="column" flex={1} display="flex" width="100%" padding="0px 32px" __css={styles}>
        {children}
      </Box>
    </Box>
  );
};
