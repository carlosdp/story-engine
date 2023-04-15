import { Box, useStyleConfig } from '@chakra-ui/react';

export type PageContainerProps = {
  variant?: 'full-bleed';
  children: React.ReactNode;
};

export const PageContainer = ({ variant, children }: PageContainerProps) => {
  const styles = useStyleConfig('PageContainer', { variant });

  return (
    <Box alignItems="center" flexDirection="column" display="flex" width="100%" height="100%">
      <Box flexDirection="column" flex={1} display="flex" width="100%" padding="0px 32px" __css={styles}>
        {children}
      </Box>
    </Box>
  );
};
