import { Fragment, useState } from "react";
import { NavLink } from "react-router-dom";
import { Dialog, Transition, Disclosure } from "@headlessui/react";
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
  ChevronDownIcon,
  CubeIcon,
  ClockIcon,
  DocumentChartBarIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";

// ✅ ADDED: Proper type definitions
interface BaseNavItem {
  name: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  type?: "link" | "group";
}

interface LinkNavItem extends BaseNavItem {
  type: "link";
  href: string;
}

interface GroupNavItem extends BaseNavItem {
  type: "group";
  items: LinkNavItem[];
}

type NavItem = LinkNavItem | GroupNavItem;

// Navigation structure for regular users (flat)
const userNavigation: LinkNavItem[] = [
  {
    name: "Quick Actions",
    href: "/quick-actions",
    icon: SparklesIcon,
    type: "link",
  },
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon, type: "link" },
  { name: "Customers", href: "/customers", icon: UsersIcon, type: "link" },
  { name: "Bills", href: "/bills", icon: DocumentTextIcon, type: "link" },
  { name: "Payments", href: "/payments", icon: CreditCardIcon, type: "link" },
  {
    name: "Daily Sales",
    href: "/daily-sales",
    icon: DocumentChartBarIcon,
    type: "link",
  },
];

// Navigation structure for admins (grouped)
const adminNavigation: NavItem[] = [
  {
    name: "Quick Actions",
    href: "/quick-actions",
    icon: SparklesIcon,
    type: "link",
  },
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    type: "link",
  },
  {
    name: "Billing Module",
    icon: BanknotesIcon,
    type: "group",
    items: [
      { name: "Customers", href: "/customers", icon: UsersIcon, type: "link" },
      { name: "Bills", href: "/bills", icon: DocumentTextIcon, type: "link" },
      {
        name: "Payments",
        href: "/payments",
        icon: CreditCardIcon,
        type: "link",
      },
    ],
  },
  {
    name: "Operations Module",
    icon: BuildingStorefrontIcon,
    type: "group",
    items: [
      { name: "Products", href: "/products", icon: CubeIcon, type: "link" },
      {
        name: "Daily Sales",
        href: "/daily-sales",
        icon: DocumentChartBarIcon,
        type: "link",
      },
    ],
  },
  {
    name: "Users",
    href: "/users",
    icon: UsersIcon,
    type: "link",
  },
  {
    name: "Reports",
    href: "/reports",
    icon: ChartBarIcon,
    type: "link",
  },
  {
    name: "Activity Logs",
    href: "/activity-logs",
    icon: ClockIcon,
    type: "link",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Cog6ToothIcon,
    type: "link",
  },
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
  const navigation = isAdmin ? adminNavigation : userNavigation;

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
            {(isDesktopOpen || isMobile) && (
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
          {navigation.map((item) => {
            // Regular link item
            if (item.type === "link") {
              return (
                <NavLink
                  key={item.name}
                  to={(item as LinkNavItem).href}
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
                      isDesktopOpen || isMobile ? "mr-3" : "mx-auto"
                    )}
                    aria-hidden="true"
                  />
                  {(isDesktopOpen || isMobile) && item.name}
                </NavLink>
              );
            }

            // Grouped dropdown item (only for admins)
            if (item.type === "group" && isAdmin) {
              const groupItem = item as GroupNavItem;

              // Don't show grouped items when sidebar is collapsed
              if (!isDesktopOpen && !isMobile) {
                // In collapsed mode, show group items as individual flat links
                return (
                  <Fragment key={item.name}>
                    {groupItem.items?.map((subItem) => (
                      <NavLink
                        key={subItem.name}
                        to={subItem.href}
                        onClick={isMobile ? onClose : undefined}
                        className={({ isActive }) =>
                          clsx(
                            "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                            isActive
                              ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                          )
                        }
                        title={subItem.name}
                      >
                        <subItem.icon
                          className="h-5 w-5 flex-shrink-0 mx-auto"
                          aria-hidden="true"
                        />
                      </NavLink>
                    ))}
                  </Fragment>
                );
              }

              return (
                <Disclosure key={item.name} as="div" defaultOpen>
                  {({ open }) => (
                    <>
                      <Disclosure.Button
                        className={clsx(
                          "w-full group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                          "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                        )}
                      >
                        <div className="flex items-center">
                          <item.icon
                            className="h-5 w-5 flex-shrink-0 mr-3"
                            aria-hidden="true"
                          />
                          <span>{item.name}</span>
                        </div>
                        <ChevronDownIcon
                          className={clsx(
                            "h-4 w-4 transition-transform",
                            open ? "transform rotate-180" : ""
                          )}
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className="mt-1 space-y-1">
                        {groupItem.items?.map((subItem) => (
                          <NavLink
                            key={subItem.name}
                            to={subItem.href}
                            onClick={isMobile ? onClose : undefined}
                            className={({ isActive }) =>
                              clsx(
                                "group flex items-center pl-11 pr-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                isActive
                                  ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                              )
                            }
                          >
                            <subItem.icon
                              className="h-4 w-4 flex-shrink-0 mr-3"
                              aria-hidden="true"
                            />
                            {subItem.name}
                          </NavLink>
                        ))}
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              );
            }

            return null;
          })}
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
