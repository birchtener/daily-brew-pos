
interface LogoProps extends React.SVGProps<SVGSVGElement> {
  color?: string;
  size?: number | string;
}

const Logo: React.FC<LogoProps> = ({ 
  color = 'currentColor', 
  size = '31', 
  ...props 
}) => {
  const numericSize = typeof size === 'string' ? parseFloat(size) : size;
  const calculatedHeight = isNaN(numericSize) ? undefined : (numericSize * 27) / 31;

  return (
    <svg 
      width={size} 
      height={calculatedHeight}
      viewBox="0 0 31 27" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path 
        d="M14.727 12.4223C16.9658 8.05808 22.1019 6.16059 26.6811 8.01152L30.5406 9.5736C30.4556 9.14422 30.3512 8.72103 30.2149 8.29752C28.0524 1.579 19.6126 -1.73809 11.4052 0.914274C7.47808 2.17833 4.1785 4.60007 2.10591 7.73163C0.89095 9.56737 0.199306 11.5109 0 13.4658L6.85884 15.6665C9.95042 16.6579 13.2645 15.3043 14.7332 12.4415L14.727 12.4223Z" 
        fill={color} 
      />
      <path 
        d="M25.6047 10.6737C22.4074 9.38711 18.8251 10.6995 17.2651 13.7404C15.1568 17.8501 10.4038 19.8156 5.97358 18.3947L0.0964436 16.5047C0.181207 16.9661 0.291418 17.4405 0.44013 17.9025C1.35719 20.7516 3.39897 23.0688 6.26177 24.5374C6.73254 24.7789 7.21637 24.9949 7.71325 25.1856C11.2234 26.5202 15.3288 26.5691 19.2433 25.2985C23.1577 24.0279 26.47 21.6127 28.5426 18.4811C29.7575 16.6454 30.4557 14.6892 30.655 12.7342L25.6109 10.693L25.6047 10.6737Z" 
        fill={color} 
      />
    </svg>
  );
};

export default Logo;