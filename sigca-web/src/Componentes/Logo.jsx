import logo from '../assets/logoApp.png';

export default function Logo({ className = "w-10 h-10" }) {
  return (
    <img 
      src={logo} 
      alt="SIGCA Logo" 
      className={className}
    />
  );
}