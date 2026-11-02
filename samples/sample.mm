#import <Foundation/Foundation.h>
#include <string>
// Preview active projects.
std::string label(bool active) {
    if (active) return "eenei";
    return "Archived";
}
