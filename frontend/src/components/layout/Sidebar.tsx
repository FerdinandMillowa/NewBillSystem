import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { Dialog, Transition } from "@headlessui/react";
import { useAuth } from "../../context/AuthContext";
import {
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  DocumentChartBarIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

const navigation = [
  {
    name: "Quick Actions",
    href: "/quick-actions",
    icon: SparklesIcon,
    description: "Fast access to daily tasks",
    adminOnly: false,
  },
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, adminOnly: false },
  { name: "Customers", href: "/customers", icon: UsersIcon, adminOnly: false },
  { name: "Bills", href: "/bills", icon: DocumentTextIcon, adminOnly: false },
  {
    name: "Payments",
    href: "/payments",
    icon: CreditCardIcon,
    adminOnly: false,
  },
  {
    name: "Products",
    href: "/products",
    icon: CubeIcon,
    adminOnly: true, // Only admins can access
  },
  {
    name: "Daily Sales",
    href: "/daily-sales",
    icon: DocumentChartBarIcon,
    adminOnly: false,
  },
  {
    name: "User Management",
    href: "/users",
    icon: UsersIcon,
    adminOnly: true, // Only admins can access
  },
  { name: "Reports", href: "/reports", icon: ChartBarIcon, adminOnly: true },
  { name: "Settings", href: "/settings", icon: Cog6ToothIcon, adminOnly: true },
];

interface SidebarProps {
  isOpen: boolean;
  isDesktopOpen: boolean;
  onClose: () => void;
  onDesktopToggle: () => void;
}

export const Sidebar = ({
  isOpen,
  isDesktopOpen,
  onClose,
  onDesktopToggle,
}: SidebarProps) => {
  const { isAdmin } = useAuth();

  const filteredNav = navigation.filter((item) => !item.adminOnly || isAdmin);

  // Sidebar Content Component
  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between flex-shrink-0 px-4 mb-6">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
              <img
                src="/logo.png"
                alt="Pitch and Roll Logo"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  // Fallback to SVG if image fails to load
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        `;
                  }
                }}
              />
            </div>
            {isDesktopOpen && (
              <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">
                Pitch&Roll
              </span>
            )}
          </div>

          {/* Desktop Toggle Button */}
          {!isMobile && (
            <button
              onClick={onDesktopToggle}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isDesktopOpen ? (
                <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          )}

          {/* Close button for mobile */}
          {isMobile && (
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 space-y-1">
          {filteredNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) =>
                clsx(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                )
              }
            >
              <item.icon
                className={clsx(
                  "h-5 w-5 flex-shrink-0",
                  isDesktopOpen ? "mr-3" : "mx-auto"
                )}
                aria-hidden="true"
              />
              {isDesktopOpen && item.name}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={clsx(
          "hidden lg:flex flex-shrink-0 transition-all duration-300",
          isDesktopOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col w-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-xs">
                    <div className="flex h-full flex-col bg-white dark:bg-gray-800 shadow-xl">
                      <SidebarContent isMobile={true} />
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
