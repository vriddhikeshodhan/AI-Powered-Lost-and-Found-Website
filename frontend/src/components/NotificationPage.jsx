import React, { useEffect, useState } from "react";

const MyItems = () => {
  const [lostItems, setLostItems] = useState([]);
  const [foundItems, setFoundItems] = useState([]);
  const [activeTab, setActiveTab] = useState("lost");

  // CUSTOM POPUP
  const showCustomMessage = (title, message, colorClasses) => {
    const messageBox = document.createElement("div");
    messageBox.id = "custom-message";
    messageBox.className =
      "fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50";
    messageBox.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
        <div class="p-3 rounded-md ${colorClasses} border-l-4">
          <h4 class="font-bold">${title}</h4>
          <p class="text-sm">${message}</p>
        </div>
        <div class="mt-4 text-right">
          <button onclick="document.getElementById('custom-message').remove()" 
            class="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-4 rounded-lg">
            Got it
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(messageBox);
  };

  const handleResolve = (itemId, type) => {
    showCustomMessage(
      "Action Taken",
      type === "lost"
        ? "This item is now marked as resolved."
        : "This found item is marked as claimed.",
      "bg-green-100 border-green-400 text-green-700"
    );
  };

  // ITEM CARD COMPONENT
  const ItemCard = ({ item, type }) => {
    const isResolved = item.status === "Resolved";
    const statusColor = isResolved
      ? "bg-gray-400"
      : type === "lost"
      ? "bg-red-500"
      : "bg-green-500";

    const typeClass = type === "lost" ? "item-card-lost" : "item-card-found";
    const actionText = type === "lost" ? "Mark as Found" : "Mark as Claimed";
    const actionLink = isResolved ? "Undo Resolve" : actionText;

    return (
      <div
        className={`flex items-start bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition ${typeClass}`}
      >
        <img
          src={item.img}
          alt={item.name}
          onError={(e) => {
            e.target.src =
              "https://placehold.co/100x100/e5e7eb/6b7280?text=Item";
          }}
          className="w-20 h-20 object-cover rounded-md mr-4"
        />

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-gray-800">{item.name}</h3>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full text-white ${statusColor}`}
            >
              {item.status}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            <strong>{type === "lost" ? "Lost" : "Found"} Date:</strong>{" "}
            {item.date}
          </p>
          <p className="text-sm text-gray-500">
            <strong>Location:</strong> {item.location}
          </p>

          <div className="mt-3 space-x-3">
            <button className="text-sm font-medium text-green-600 hover:text-green-800">
              View Details
            </button>
            <button className="text-sm font-medium text-blue-600 hover:text-blue-800">
              Edit
            </button>
            <button
              onClick={() => handleResolve(item.id, type)}
              className={`text-sm font-medium ${
                isResolved ? "text-gray-500" : "text-red-600 hover:text-red-800"
              }`}
            >
              {actionLink}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // DASHBOARD COUNTS
  const totalLost = lostItems.length;
  const totalFound = foundItems.length;
  const resolvedCount =
    lostItems.filter((i) => i.status === "Resolved").length +
    foundItems.filter((i) => i.status === "Resolved").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .tab-active { background-color:#10B981; color:white !important; }
        .item-card-lost { border-left:6px solid #EF4444; }
        .item-card-found { border-left:6px solid #10B981; }
      `}</style>

      {/* HEADER */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-xl font-bold text-gray-800">
            Lost<span className="text-green-500">&Found</span>
          </div>

          <nav className="space-x-4">
            <span className="text-gray-600 hover:text-green-500 cursor-pointer">
              Home
            </span>
            <span className="text-gray-600 hover:text-green-500 cursor-pointer">
              Report New Item
            </span>
            <span className="px-3 py-2 rounded-lg font-semibold tab-active cursor-pointer">
              Profile
            </span>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">My Items</h1>

          {/* ⭐ ADDED BACK: Report New Item Button ⭐ */}
          <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg">
            + Report New Item
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white shadow-md p-6 rounded-xl border-l-4 border-red-500">
            <h3 className="text-xl font-bold text-gray-700">Total Lost Items</h3>
            <p className="text-4xl font-extrabold text-red-500 mt-2">
              {totalLost}
            </p>
          </div>

          <div className="bg-white shadow-md p-6 rounded-xl border-l-4 border-green-500">
            <h3 className="text-xl font-bold text-gray-700">
              Total Found Items
            </h3>
            <p className="text-4xl font-extrabold text-green-500 mt-2">
              {totalFound}
            </p>
          </div>

          <div className="bg-white shadow-md p-6 rounded-xl border-l-4 border-gray-500">
            <h3 className="text-xl font-bold text-gray-700">Items Resolved</h3>
            <p className="text-4xl font-extrabold text-gray-700 mt-2">
              {resolvedCount}
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b border-gray-300 mb-8">
          <button
            onClick={() => setActiveTab("lost")}
            className={`py-3 px-6 text-lg font-semibold rounded-t-lg ${
              activeTab === "lost"
                ? "tab-active"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            My Lost Items ({lostItems.length})
          </button>

          <button
            onClick={() => setActiveTab("found")}
            className={`py-3 px-6 text-lg font-semibold rounded-t-lg ${
              activeTab === "found"
                ? "tab-active"
                : "text-gray-600 hover:bg-green-50"
            }`}
          >
            My Found Items ({foundItems.length})
          </button>
        </div>

        {/* ITEMS LIST */}
        <div className="space-y-6">
          {(activeTab === "lost" ? lostItems : foundItems).length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-dashed border-gray-300">
              <h3 className="text-xl font-medium text-gray-900">
                No Items Reported Yet
              </h3>
              <p className="text-gray-500">
                Get started by reporting an item.
              </p>
            </div>
          ) : (
            (activeTab === "lost" ? lostItems : foundItems).map((item) => (
              <ItemCard key={item.id} item={item} type={activeTab} />
            ))
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white mt-10 shadow-inner">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          © 2025 Lost&Found. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default MyItems;