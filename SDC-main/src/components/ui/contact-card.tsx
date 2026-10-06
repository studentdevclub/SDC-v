import React from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

export type ContactInfoProps = React.ComponentProps<'div'> & {
	icon: LucideIcon | React.ComponentType<{ className?: string }>;
	label: string;
	value: string;
	href?: string;
};

export type ContactCardProps = Omit<React.ComponentProps<'div'>, 'title'> & {
	// Content props
	title?: React.ReactNode;
	description?: React.ReactNode;
	contactInfo?: ContactInfoProps[];
	formSectionClassName?: string;
};

export function ContactCard({
	title = 'Contact With Us',
	description = 'If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.',
	contactInfo,
	className,
	formSectionClassName,
	children,
	...props
}: ContactCardProps) {
	return (
		<div
			className={cn(
				'relative flex flex-col w-full max-w-3xl mx-auto bg-transparent items-center justify-center text-center gap-7 sm:gap-9 overflow-visible',
				className,
			)}
			style={{ gap: '28px' }}
			{...props}
		>
			{/* Top Centered Header Section */}
			<div className="flex flex-col items-center justify-center text-center gap-3 w-full" style={{ gap: '12px' }}>
				<div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)]">
					{title}
				</div>

				<div className="text-xs sm:text-sm md:text-base leading-relaxed max-w-xl text-[#d4cfe2] drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] px-2">
					{description}
				</div>

				{/* Floating Contact Info (Unboxed, Centered & Clickable Redirects) */}
				{contactInfo && contactInfo.length > 0 && (
					<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 pt-2 w-full">
						{contactInfo.map((info, index) => (
							<ContactInfo key={index} {...info} />
						))}
					</div>
				)}
			</div>

			{/* Centered Form Section Directly Underneath */}
			<div
				className={cn(
					'w-full max-w-xl mx-auto bg-transparent flex flex-col items-center justify-center',
					formSectionClassName,
				)}
			>
				{children}
			</div>
		</div>
	);
}

export function ContactInfo({
	icon: Icon,
	label,
	value,
	href,
	className,
	...props
}: ContactInfoProps) {
	const content = (
		<>
			<Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-[#ff6b1a] shrink-0 drop-shadow-[0_0_8px_rgba(255,107,26,0.8)] group-hover:scale-110 transition-transform" />
			<div className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm">
				<span className="font-bold text-white uppercase tracking-wider">{label}:</span>
				<span className="text-[#d4cfe2] group-hover:text-white group-hover:underline transition-colors">{value}</span>
			</div>
		</>
	);

	if (href) {
		return (
			<a
				href={href}
				target={href.startsWith('mailto:') ? undefined : '_blank'}
				rel={href.startsWith('mailto:') ? undefined : 'noreferrer'}
				className={cn(
					'group inline-flex items-center gap-2 text-center text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] cursor-pointer hover:opacity-100 transition-opacity',
					className,
				)}
			>
				{content}
			</a>
		);
	}

	return (
		<div
			className={cn(
				'inline-flex items-center gap-2 text-center text-white/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] select-text',
				className,
			)}
			{...props}
		>
			{content}
		</div>
	);
}

export default ContactCard;
